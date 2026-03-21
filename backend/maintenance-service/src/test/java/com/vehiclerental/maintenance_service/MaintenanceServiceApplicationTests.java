package com.vehiclerental.maintenance_service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vehiclerental.maintenance_service.config.RoleAccessConfig;
import com.vehiclerental.maintenance_service.controller.MaintenanceController;
import com.vehiclerental.maintenance_service.exception.GlobalExceptionHandler;
import com.vehiclerental.maintenance_service.model.MaintenanceRecord;
import com.vehiclerental.maintenance_service.model.ReportedIssue;
import com.vehiclerental.maintenance_service.service.MaintenanceService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MaintenanceServiceApplicationTests {

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Mock
	private MaintenanceService service;

	@Mock
	private RoleAccessConfig accessConfig;

	@InjectMocks
	private MaintenanceController controller;

	private MockMvc mockMvc() {
		return MockMvcBuilders.standaloneSetup(controller)
				.setControllerAdvice(new GlobalExceptionHandler())
				.build();
	}

	@Test
	void getVehicleIssues_returnsIssuesFromService() throws Exception {
		ReportedIssue issue = new ReportedIssue();
		issue.setId("issue-1");
		issue.setVehicleId("vehicle-1");
		issue.setIssueType("ENGINE");

		when(service.getVehicleIssues("vehicle-1")).thenReturn(List.of(issue));

		mockMvc().perform(get("/api/maintenance/issues/vehicle/vehicle-1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value("issue-1"))
				.andExpect(jsonPath("$[0].issueType").value("ENGINE"));
	}

	@Test
	void startMaintenance_rejectsRoleOutsideAllowedList() throws Exception {
		when(accessConfig.getMaintenanceManageRoles()).thenReturn(List.of("REPAIR_ADVISOR"));

		mockMvc().perform(put("/api/maintenance/record-1/start")
						.header("X-User-Role", "CUSTOMER"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.message", containsString("Access denied")));
	}

	@Test
	void completeMaintenance_allowsConfiguredRoleAndCallsService() throws Exception {
		when(accessConfig.getMaintenanceManageRoles()).thenReturn(List.of("REPAIR_ADVISOR"));

		MaintenanceRecord completed = new MaintenanceRecord();
		completed.setId("record-1");
		completed.setStatus("COMPLETED");

		when(service.completeMaintenance(eq("record-1"), eq(3500.0))).thenReturn(completed);

	mockMvc().perform(put("/api/maintenance/record-1/complete")
						.header("X-User-Role", "REPAIR_ADVISOR")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CompleteMaintenanceRequestBody(3500.0))))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value("record-1"))
				.andExpect(jsonPath("$.status").value("COMPLETED"));

		verify(service).completeMaintenance("record-1", 3500.0);
	}

	private record CompleteMaintenanceRequestBody(Double actualCost) {
	}
}

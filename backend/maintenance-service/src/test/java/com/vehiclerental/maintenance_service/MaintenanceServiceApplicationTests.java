package com.vehiclerental.maintenance_service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class MaintenanceServiceApplicationTests {

	@Test
	void contextLoads() {
		// Application context loads successfully
	}

}

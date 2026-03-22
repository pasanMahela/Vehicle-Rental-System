package com.orchid.booking.client;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utility component to extract Authorization header from current HTTP request context.
 * Used to propagate authentication to downstream microservice calls.
 */
@Component
public class RequestAuthHeaderProvider {

    /**
     * Extracts the Authorization header from the current request context.
     * This header contains the JWT token that will be used for authenticating
     * calls to other microservices.
     *
     * @return Authorization header value (e.g., "Bearer <token>"), or null if not found
     */
    public String getAuthorizationHeader() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletAttributes)) {
            return null;
        }

        HttpServletRequest request = servletAttributes.getRequest();
        return request.getHeader(HttpHeaders.AUTHORIZATION);
    }
}

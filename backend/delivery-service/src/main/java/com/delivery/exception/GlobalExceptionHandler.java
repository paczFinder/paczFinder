package com.delivery.exception;

import com.delivery.dto.ErrorResponse;
import jakarta.persistence.PersistenceException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class GlobalExceptionHandler {

    private static final Logger LOG = Logger.getLogger(GlobalExceptionHandler.class);

    @ServerExceptionMapper
    public Response handleWebApplicationException(WebApplicationException exception, UriInfo uriInfo) {
        int status = exception.getResponse() != null ? exception.getResponse().getStatus() : 500;
        Response.Status statusEnum = Response.Status.fromStatusCode(status);
        String error = statusEnum != null ? statusEnum.getReasonPhrase() : "HTTP Error";

        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            message = error;
        }

        String path = uriInfo != null ? uriInfo.getPath() : null;
        ErrorResponse errorResponse = ErrorResponse.of(status, error, message, path);

        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(errorResponse)
                .build();
    }

    @ServerExceptionMapper
    public Response handleConstraintViolationException(ConstraintViolationException exception, UriInfo uriInfo) {
        List<ErrorResponse.ValidationError> violations = new ArrayList<>();

        for (ConstraintViolation<?> violation : exception.getConstraintViolations()) {
            String field = null;
            for (Path.Node node : violation.getPropertyPath()) {
                field = node.getName();
            }
            violations.add(new ErrorResponse.ValidationError(field, violation.getMessage()));
        }

        String summary = violations.stream()
                .map(v -> (v.field() != null ? v.field() + ": " : "") + v.message())
                .collect(Collectors.joining(", "));

        String message = summary.isEmpty() ? "Validation failed" : "Validation failed: " + summary;
        String path = uriInfo != null ? uriInfo.getPath() : null;

        ErrorResponse errorResponse = ErrorResponse.of(
                Response.Status.BAD_REQUEST.getStatusCode(),
                Response.Status.BAD_REQUEST.getReasonPhrase(),
                message,
                path,
                violations
        );

        return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON)
                .entity(errorResponse)
                .build();
    }

    @ServerExceptionMapper
    public Response handlePersistenceException(PersistenceException exception, UriInfo uriInfo) {
        LOG.error("Database persistence exception caught: " + exception.getMessage(), exception);
        String path = uriInfo != null ? uriInfo.getPath() : null;
        Throwable cause = exception.getCause();

        while (cause != null && !(cause instanceof org.hibernate.exception.ConstraintViolationException)) {
            cause = cause.getCause();
        }

        if (cause instanceof org.hibernate.exception.ConstraintViolationException cve) {
            String constraintName = cve.getConstraintName();
            String message = "Database constraint violation";

            if (constraintName != null) {
                String lower = constraintName.toLowerCase();
                if (lower.contains("registration_number")) {
                    message = "Vehicle with this registration number already exists";
                } else if (lower.contains("delivery_id")) {
                    message = "Delivery is already assigned to a trip";
                } else if (lower.contains("vehicle_id")) {
                    message = "Referenced vehicle does not exist or cannot be modified";
                } else {
                    message = "Database constraint violation: " + constraintName;
                }
            } else if (cve.getSQLException() != null && cve.getSQLException().getMessage() != null) {
                message = cve.getSQLException().getMessage();
            }

            return Response.status(Response.Status.CONFLICT)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(ErrorResponse.of(
                            Response.Status.CONFLICT.getStatusCode(),
                            Response.Status.CONFLICT.getReasonPhrase(),
                            message,
                            path
                    ))
                    .build();
        }

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .type(MediaType.APPLICATION_JSON)
                .entity(ErrorResponse.of(
                        Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(),
                        Response.Status.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                        "A database error occurred",
                        path
                ))
                .build();
    }

    @ServerExceptionMapper
    public Response handleProcessingException(ProcessingException exception, UriInfo uriInfo) {
        String path = uriInfo != null ? uriInfo.getPath() : null;
        String message = "Malformed request payload or invalid parameter format";
        if (exception.getCause() != null && exception.getCause().getMessage() != null) {
            message = "Malformed request payload: " + exception.getCause().getMessage();
        }

        ErrorResponse errorResponse = ErrorResponse.of(
                Response.Status.BAD_REQUEST.getStatusCode(),
                Response.Status.BAD_REQUEST.getReasonPhrase(),
                message,
                path
        );

        return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON)
                .entity(errorResponse)
                .build();
    }

    @ServerExceptionMapper
    public Response handleIllegalArgumentException(IllegalArgumentException exception, UriInfo uriInfo) {
        String path = uriInfo != null ? uriInfo.getPath() : null;
        ErrorResponse errorResponse = ErrorResponse.of(
                Response.Status.BAD_REQUEST.getStatusCode(),
                Response.Status.BAD_REQUEST.getReasonPhrase(),
                exception.getMessage() != null ? exception.getMessage() : "Invalid argument provided",
                path
        );

        return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON)
                .entity(errorResponse)
                .build();
    }

    @ServerExceptionMapper
    public Response handleThrowable(Throwable exception, UriInfo uriInfo) {
        LOG.error("Unhandled exception caught: " + exception.getMessage(), exception);
        String path = uriInfo != null ? uriInfo.getPath() : null;
        ErrorResponse errorResponse = ErrorResponse.of(
                Response.Status.INTERNAL_SERVER_ERROR.getStatusCode(),
                Response.Status.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                exception.getMessage() != null ? exception.getMessage() : "An unexpected server error occurred",
                path
        );

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .type(MediaType.APPLICATION_JSON)
                .entity(errorResponse)
                .build();
    }
}

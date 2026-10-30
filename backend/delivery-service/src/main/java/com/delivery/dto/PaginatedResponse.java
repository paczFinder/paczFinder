package com.delivery.dto;

import java.util.List;

public record PaginatedResponse<T>(
        List<T> content,
        long totalElements,
        int page,
        int size,
        int totalPages
) {
}


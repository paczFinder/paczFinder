package org.example.routeoptimizationservice.controller;

import org.example.routeoptimizationservice.dto.JobSubmissionResponse;
import org.example.routeoptimizationservice.dto.OptimizationRequest;
import org.example.routeoptimizationservice.dto.OptimizationResult;
import org.example.routeoptimizationservice.service.RouteOptimizationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.validation.Valid;

import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/v1/optimization")
public class RouteOptimizationController {

    private final RouteOptimizationService optimizationService;

    public RouteOptimizationController(RouteOptimizationService optimizationService) {
        this.optimizationService = optimizationService;
    }

    @PostMapping("/ant")
    public ResponseEntity<JobSubmissionResponse> antColony(@Valid @RequestBody OptimizationRequest request) {
        String jobId = optimizationService.scheduleOptimization(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new JobSubmissionResponse(jobId, "ACCEPTED"));
    }

    @PostMapping("/annealing")
    public ResponseEntity<JobSubmissionResponse> simulatedAnnealing(@Valid @RequestBody OptimizationRequest request) {
        String jobId = optimizationService.scheduleAnnealingOptimization(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new JobSubmissionResponse(jobId, "ACCEPTED"));
    }

    @PostMapping("/bruteForce")
    public ResponseEntity<JobSubmissionResponse> bruteForce(@Valid @RequestBody OptimizationRequest request) {
        String jobId = optimizationService.scheduleBruteForceOptimization(request);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(new JobSubmissionResponse(jobId, "ACCEPTED"));
    }

    @GetMapping(value = "/stream/{jobId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String jobId) {
        SseEmitter emitter = new SseEmitter(0L);

        CompletableFuture<OptimizationResult> future = optimizationService.getJobFuture(jobId);
        OptimizationResult completed = optimizationService.getCompletedResult(jobId);

        if (completed != null) {
            sendResult(emitter, completed);
            return emitter;
        }

        if (future == null) {
            emitter.completeWithError(new IllegalArgumentException("Nieznany jobId: " + jobId));
            return emitter;
        }

        future.thenAccept(result -> sendResult(emitter, result))
                .exceptionally(ex -> {
                    emitter.completeWithError(ex);
                    return null;
                });

        return emitter;
    }

    private void sendResult(SseEmitter emitter, OptimizationResult result) {
        try {
            emitter.send(SseEmitter.event()
                    .id("result")
                    .name("optimization-result")
                    .data(result));
            emitter.complete();
        } catch (Exception ex) {
            emitter.completeWithError(ex);
        }
    }
}

FROM eclipse-temurin:25-jdk as builder
WORKDIR /workspace
COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=builder /workspace/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

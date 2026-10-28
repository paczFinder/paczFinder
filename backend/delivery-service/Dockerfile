FROM eclipse-temurin:25-jdk-alpine AS build
WORKDIR /work

COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw && ./mvnw dependency:go-offline -B

COPY src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:25-jre-alpine
WORKDIR /deployments

COPY --from=build /work/target/quarkus-app/lib/ /deployments/lib/
COPY --from=build /work/target/quarkus-app/*.jar /deployments/
COPY --from=build /work/target/quarkus-app/app/ /deployments/app/
COPY --from=build /work/target/quarkus-app/quarkus/ /deployments/quarkus/

EXPOSE 8080
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar quarkus-run.jar"]
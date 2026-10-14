FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

FROM python:3.12-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-21-jre-headless \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir h5py==3.16.0 Pillow==11.0.0

WORKDIR /app
COPY --from=build /app/target/lfi-dashboard-backend-0.0.1-SNAPSHOT.jar app.jar
COPY tools ./tools

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]

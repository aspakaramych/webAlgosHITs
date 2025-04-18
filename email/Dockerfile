FROM amazoncorretto:17-alpine3.17

WORKDIR /app

COPY target/email-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
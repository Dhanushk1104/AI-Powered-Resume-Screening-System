VisualFlow Backend (Spring Boot)
--------------------------------
Requirements:
  - Java 17+
  - Maven

How to run:
  mvn package
  java -jar target/visualflow-backend-0.0.1-SNAPSHOT.jar

Or during development:
  mvn spring-boot:run

The backend runs on port 8080 and proxies analysis requests to the AI service at http://localhost:8000/analyze

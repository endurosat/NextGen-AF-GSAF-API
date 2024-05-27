# NextGen GSAF API

NextGen GSAF API is a robust NestJS project that acts as the backbone API for the ground segment of the NextGen framework. It facilitates comprehensive client management, including the creation and listing of clients, applications management such as creating applications, linking them to clients, creating builds, and preparing these builds for deployment. Additionally, the API handles the initialization of ground and sanitation commands, enabling the start and stop of applications on demand or per schedule.

## Main Components

### 1. Image Builder

This service prepares a build of the client's codebase, taking a git repository or a source code archive as input. The Image Builder dockerizes the application and prepares a docker image with all necessary configurations, which includes:
- **JWT Token Configuration:** Generates a policy payload for a JWT token and inserts it into the docker image as an environment variable.
- **Port Forwarding Configuration:** Decides on a port to forward for client app communication with the ground.

Generated client images are stored in a private NextGen Docker Registry and as .tar files. These images can be downloaded by the client for testing. The build records are stored in a PostgreSQL database.

### 2. Client Dashboard

Allows clients to initiate a satellite deployment procedure using a specific build. It generates a delta diff file from this build for deployment and stores these files for each client. The dashboard then proceeds to uplink the delta diff file and prepares a command for updating the client application on the satellite.

### 3. Playground

Provides a testing environment simulating the satellite onboard architecture. This includes a Docker environment matching the satellite Payload Computer, along with simulated NextGen Satellite Gateway and APIs for the satellite infrastructure. Clients can test deployments, send ground commands, monitor application logs, and access the container for testing and debugging.

## Tech Stack

NextGen GSAF API is built with a focus on robustness and scalability, using technologies such as:

- NestJS
- TypeORM
- PostgreSQL
- Dockerode
- Socket.io-client
- JWT for authentication
- Swagger for API documentation
- And more...

Refer to the `package.json` file for specific versions of each dependency.

## Installation Guide

To get NextGen GSAF API running, follow these essential steps:

1. **Clone the repository**

```bash
git clone https://github.com/your-username/nextgen-gsaf-api.git
cd nextgen-gsaf-api
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure the API**

- Ensure you have self-signed certificates for TLS.
- Download the required tar files (`nextgen-base-image-client` and `nextgen-base-image-gateway`) and update the placeholders with the actual links.
- Implement your `CommandHandler` interface in `src/commands/commands.service.ts` to define the transfer of ground commands to the satellite.
- Fill in your database credentials in the `.env` file:

```plaintext
DB_HOST=your-host
DB_PORT=your-port
DB_USER=your-username
DB_PASS=your-password
DB_NAME=your-db-name
```

4. **Build and start the API**

```bash
npm run build
npm start
```

The API is now set up and ready to communicate with your NextGen satellite applications.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgment

- All the brilliant minds contributing to the NextGen framework
- The open-source community

Your support and contributions make powerful tools like this possible. Happy coding!
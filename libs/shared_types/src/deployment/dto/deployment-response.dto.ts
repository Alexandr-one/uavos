export class DeploymentResponseDto {
    constructor(
        public success: boolean,
        public message?: string,
        public url?: string,
        public isRunning?: boolean
    ) { }
}

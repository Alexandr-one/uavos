export class DeploymentGhRequestDto {
    constructor(
        public environment: string,
        public buildDir?: string,
    ) { }
}

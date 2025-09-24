import { SimpleGit } from "simple-git";

export class DeploymentStatusRequestDto {
    constructor(
        public hasUnpublishedChanges?: boolean,
        public message?: string,
        public currentTag?: string,
    ) { }
}
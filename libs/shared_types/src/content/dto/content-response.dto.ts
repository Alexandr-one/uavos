export class ContentResponseDto<T> {
  constructor(
    public success: boolean,
    public data: T | null,
    public message?: string,
    public count?: number,
  ) { }
}

export class ErrorResponse {
    constructor(statusCode, message) {
        this.statusCode = statusCode;
        this.message = message;
    }
    send(res) {
        res.status(this.statusCode).json({ error: this.message });
    }
}
//# sourceMappingURL=error_response.utils.js.map
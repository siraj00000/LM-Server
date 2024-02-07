import { ErrorResponse } from '../utils/error_response.utils.js';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';
export const errorHandler = (err, req, res, next) => {
    if (err instanceof MongoError && err.code === 11000) {
        // Extract the field name causing the duplicate key error from the error message
        const fieldName = err.message?.match(/index: (.+?)_1 dup key/)?.[1];
        if (fieldName) {
            const message = `${fieldName} already exists.`;
            const errorResponse = new ErrorResponse(400, message);
            return errorResponse.send(res);
        }
    }
    if (err instanceof MongooseError.ValidationError) {
        const message = Object.values(err.errors)
            .map((error) => error.message)
            .join(' & ');
        const errorResponse = new ErrorResponse(400, message);
        return errorResponse.send(res);
    }
    if (err instanceof ErrorResponse) {
        err.send(res);
    }
    else {
        new ErrorResponse(500, 'Internal Server Error').send(res);
    }
};
//# sourceMappingURL=error_handler.middleware.js.map
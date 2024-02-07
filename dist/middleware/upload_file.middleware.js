import multer from 'multer';
export const upload = multer({
    dest: './uploads/',
    limits: {
        files: 5 // limit to one file
    }
});
//# sourceMappingURL=upload_file.middleware.js.map
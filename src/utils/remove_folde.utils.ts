import fs from 'fs';

export const removeTmp = (path: string) => {
    fs.unlinkSync(path);
};

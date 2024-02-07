import fs from 'fs';
export const removeTmp = (path) => {
    fs.unlinkSync(path);
};
//# sourceMappingURL=remove_folder.utils.js.map
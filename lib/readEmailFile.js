import path from "path";
import fs from "fs/promises";
import ejs from "ejs";
import mjml2html from "mjml";

export const readEmailFile = async (template, payload) => {
    try {
        //* reading mjml file
        const mjmlTemplate = await fs.readFile(path.join(import.meta.dirname, "..", "emails", `${template}.mjml`), "utf-8");
        
        //* filled template with the actual values
        const filledTemplate = ejs.render(mjmlTemplate, payload);
        
        //* converting mjml into html
        return mjml2html(filledTemplate).html;
    } catch (error) {
        console.error(error);
    }
}
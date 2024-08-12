import * as pdfjsLib from '../dist/pdfjs/pdf.min.mjs'

pdfjsLib.GlobalWorkerOptions.workerSrc = '../dist/pdfjs/pdf.worker.min.mjs'

export async function fetchAndParsePDF(url) {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const lines = []
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        textContent.items.forEach((item) => {
            if (item.str) {
                lines.push(item.str)
            }
        })
    }
    return lines
}

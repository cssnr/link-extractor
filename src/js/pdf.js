import * as pdfjsLib from '../dist/pdfjs/pdf.min.mjs'

pdfjsLib.GlobalWorkerOptions.workerSrc = '../dist/pdfjs/pdf.worker.min.mjs'

export async function fetchPDF(url) {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const lines = []

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()

        // Extracting text
        textContent.items.forEach((item) => {
            if (item.str) {
                lines.push(item.str)
            }
        })

        // Extracting annotation URLs
        const annotations = await page.getAnnotations()
        annotations.forEach((annotation) => {
            if (annotation.url) {
                lines.push(annotation.url)
            }
        })
    }

    return lines
}

import * as pdfjsLib from '../dist/pdfjs/pdf.min.mjs'

pdfjsLib.GlobalWorkerOptions.workerSrc = '../dist/pdfjs/pdf.worker.min.mjs'

/**
 * @function getPDF
 * @param {String} url
 * @return {Promise<String[]>}
 */
export async function getPDF(url) {
    const response = await fetch(url)
    // const response = await fetchPDF(url)
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
            // console.log('annotation:', annotation)
            if (annotation.url) {
                lines.push(annotation.url)
            }
        })
    }

    return lines
}

// /**
//  * @function fetchPDF
//  * @param {String} pdfUrl
//  * @return {Promise<Response>}
//  */
// async function fetchPDF(pdfUrl) {
//     console.debug(`fetchPDF: ${pdfUrl}`)
//     try {
//         return await fetch(pdfUrl)
//     } catch (e) {
//         if (pdfUrl.startsWith('file://')) {
//             throw e
//         }
//         console.log(`%cPDF Fetch Error: ${e.message}`, 'color: OrangeRed')
//         const { options } = await chrome.storage.sync.get(['options'])
//         if (!options.proxyUrl) {
//             throw e
//         }
//         showToast('Fetch Failed, Trying Proxy...', 'primary')
//         const url = new URL(options.proxyUrl)
//         url.searchParams.append('url', pdfUrl)
//         console.log(`%cTrying Proxy URL: ${url.href}`, 'color: LimeGreen')
//         return await fetch(url.href)
//     }
// }

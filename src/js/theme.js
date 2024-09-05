// JS Bootstrap Theme Switcher

;(() => {
    const getStoredTheme = () => localStorage.getItem('theme')
    const setStoredTheme = (theme) => localStorage.setItem('theme', theme)
    const getMediaMatch = () =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'

    const getPreferredTheme = () => {
        const storedTheme = getStoredTheme()
        if (storedTheme) {
            return storedTheme
        } else {
            return getMediaMatch()
        }
    }

    const setTheme = (theme) => {
        // console.debug(`setTheme: ${theme}`)
        if (theme === 'auto') {
            document.documentElement.setAttribute(
                'data-bs-theme',
                getMediaMatch()
            )
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme)
        }
    }

    const stored = getStoredTheme()
    if (!stored) {
        setStoredTheme('auto')
    }
    setTheme(getPreferredTheme())

    const showActiveTheme = (theme) => {
        // console.debug(`showActiveTheme: ${theme}`)
        const themeIcon = document.querySelector('#theme-icon')
        if (!themeIcon) {
            // console.debug('No Theme Icon to Set.')
            return
        }
        document.querySelectorAll('[data-bs-theme-value]').forEach((el) => {
            if (el.dataset.bsThemeValue === theme) {
                const i = el.querySelector('i')
                themeIcon.className = i.className + ' fa-lg'
                el.classList.add('active')
                el.setAttribute('aria-pressed', 'true')
            } else {
                el.classList.remove('active')
                el.setAttribute('aria-pressed', 'false')
            }
        })
    }

    window.addEventListener('storage', (event) => {
        // console.log('storage:', event)
        if (event.key === 'theme') {
            setTheme(event.newValue)
            showActiveTheme(event.newValue)
        }
    })

    window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', () => {
            const storedTheme = getStoredTheme()
            console.debug('prefers-color-scheme: change:', storedTheme)
            if (storedTheme === 'auto') {
                const preferred = getPreferredTheme()
                setTheme(preferred)
            }
        })

    window.addEventListener('DOMContentLoaded', () => {
        const preferred = getPreferredTheme()
        // console.debug('DOMContentLoaded: preferred:', preferred)
        showActiveTheme(preferred)

        document.querySelectorAll('[data-bs-theme-value]').forEach((el) => {
            el.addEventListener('click', () => {
                const value = el.getAttribute('data-bs-theme-value')
                setStoredTheme(value)
                setTheme(value)
                showActiveTheme(value)
            })
        })
    })
})()

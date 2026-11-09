export const NUR_ZUR_ANZEIGE = { pmIgnore: true, bubblingMouseEvents: true } as const

export function alsSichererText(text: string): HTMLElement {
  const element = document.createElement('span')
  element.textContent = text
  return element
}

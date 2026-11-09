export const keineKommentare = {
  meta: {
    type: 'suggestion',
    schema: [],
    messages: {
      kommentar:
        'Keine Kommentare im Code: Namen und Struktur so wählen, dass der Code sich selbst erklärt.',
    },
  },
  create(context) {
    const { sourceCode } = context
    const melde = (kommentar) => context.report({ loc: kommentar.loc, messageId: 'kommentar' })

    return {
      'Program:exit'() {
        const skriptKommentare = sourceCode
          .getAllComments()
          .filter((kommentar) => kommentar.type !== 'Shebang')
        const templateKommentare = sourceCode.ast.templateBody?.comments ?? []
        ;[...skriptKommentare, ...templateKommentare].forEach(melde)
      },
    }
  },
}

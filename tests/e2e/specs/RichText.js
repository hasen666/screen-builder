describe('Rich Text control', () => {
  it('Rich text with mustache', () => {
    cy.visit('/');
    cy.get('[data-cy=controls-FormHtmlViewer]').drag('[data-cy=screen-drop-zone]', 'bottom');
    cy.get('[data-cy=screen-element-container]').click();
    cy.get('[data-cy=inspector-content]').clear().type('<p>Hello {{ name }}</p>', {parseSpecialCharSequences: false});
    cy.get('[data-cy=mode-preview]').click();
    cy.setPreviewDataInput('{"name":"World"}');
    cy.get('[data-cy=preview-content]').should('contain.html', '<p>Hello World</p>');
  });
});

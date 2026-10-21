interface PageTitleProps {
  title: string
}

// React 19 mueve cualquier <title> al <head>, sin importar dónde se renderice.
// Al salir de la página el <title> se desmonta y lo reemplaza el de la página nueva
function PageTitle({ title }: PageTitleProps) {
  // Un solo texto (template literal): <title> no admite varios hijos
  return <title>{`${title} · University Library`}</title>
}

export default PageTitle

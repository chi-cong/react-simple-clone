// JSX type definitions for RSC (React Simple Clone)
declare namespace JSX {
  interface IntrinsicElements {
    // Common HTML elements - extend as needed
    div: any;
    span: any;
    p: any;
    h1: any;
    h2: any;
    h3: any;
    h4: any;
    h5: any;
    h6: any;
    a: any;
    button: any;
    input: any;
    form: any;
    label: any;
    ul: any;
    ol: any;
    li: any;
    img: any;
    header: any;
    footer: any;
    main: any;
    nav: any;
    section: any;
    article: any;
    aside: any;
    table: any;
    thead: any;
    tbody: any;
    tr: any;
    td: any;
    th: any;
    // Add more elements as needed
    [elemName: string]: any; // Fallback for any other elements
  }

  interface Element {
    type: any;
    props: any;
  }
}

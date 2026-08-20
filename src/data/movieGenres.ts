// URLs exatas fornecidas na especificação — não trocar o AdoroCinema por outro site nem gerar
// buscas alternativas (ver ActionSupport.tsx / MovieGenrePicker.tsx).
export type MovieGenre =
  | 'comedia'
  | 'acao'
  | 'terror'
  | 'animacao'
  | 'romance'
  | 'suspense'
  | 'drama'
  | 'aventura'
  | 'documentarios';

export const MOVIE_GENRE_ORDER: MovieGenre[] = [
  'comedia',
  'acao',
  'terror',
  'animacao',
  'romance',
  'suspense',
  'drama',
  'aventura',
  'documentarios',
];

export const MOVIE_GENRE_LABELS: Record<MovieGenre, string> = {
  comedia: 'Comédia',
  acao: 'Ação',
  terror: 'Terror',
  animacao: 'Animação',
  romance: 'Romance',
  suspense: 'Suspense',
  drama: 'Drama',
  aventura: 'Aventura',
  documentarios: 'Documentários',
};

export const MOVIE_GENRE_URLS: Record<MovieGenre, string> = {
  comedia: 'https://www.adorocinema.com/filmes/melhores/genero-13005/',
  acao: 'https://www.adorocinema.com/filmes-todos/genero-13025/',
  terror: 'https://www.adorocinema.com/filmes-todos/genero-1309/',
  animacao: 'https://www.adorocinema.com/filmes-todos/genero-13026/',
  romance: 'https://www.adorocinema.com/filmes-todos/genero-13024/',
  suspense: 'https://www.adorocinema.com/filmes/melhores/genero-13023/',
  drama: 'https://www.adorocinema.com/filmes/melhores/genero-13008/',
  aventura: 'https://www.adorocinema.com/filmes/melhores/genero-13001/',
  documentarios: 'https://www.adorocinema.com/filmes/melhores/documentario/',
};

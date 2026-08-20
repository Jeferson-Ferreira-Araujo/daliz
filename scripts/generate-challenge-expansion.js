// Uso: node scripts/generate-challenge-expansion.js
//
// Gera a expansão contextual da biblioteca de desafios (ver plano em
// C:\Users\jeferson.araujo\.claude\plans\purring-discovering-spark.md): ~1.100 novos
// desafios ao lado dos ~932 já gerados por generate-challenges.js, cobrindo família,
// filhos, parceiro, pais/figuras importantes, amigos, clima (chuva/frio/calor/agradável/
// sol/tempestade), estações e datas comemorativas — todos usando os campos que o
// Challenge type e o ChallengeEngine já suportam (weatherTags/seasonTags/eventTags/
// relationships/contentLevel), nenhum campo novo.
//
// Cada bloco de texto bruto abaixo tem uma configuração fixa de metadados (aplicada a
// todas as linhas dele) + heurística por linha (via challengeHeuristics.js) pro resto.
// Para temas condicionados por relação (filhos/parceiro/pais/amigos), cada linha
// específica tem uma linha irmã genérica no bloco "_GENERIC" correspondente — mesmo
// padrão de personCombos.ts/eventCombos.ts, só que em escala de script.
'use strict';
const heuristics = require('./challengeHeuristics');
const { parseLines, buildChallenge, writeFile } = heuristics;

/** Constrói um array de Challenge a partir de um bloco de texto bruto numerado, aplicando
 * metadados fixos (opts) a cada linha, mais heurística por linha do challengeHeuristics. */
function buildBlock(raw, categoria, prefix, opts) {
  const lines = parseLines(raw);
  return lines.map((line, i) => buildChallenge(categoria, prefix, i + 1, line, opts.tipoBias, opts.extraTag, opts));
}

// ===========================================================================
// FAMÍLIA (geral) — familia_presenca — sem relationships (framing inclusivo de
// quem quer que more com a pessoa), ~150 desafios.
// ===========================================================================

const FAMILY_EXPANSION_RAW = `
1. Prepare o café da manhã para todo mundo em casa.
2. Deixe uma mensagem escrita na geladeira para quem mora com você.
3. Pergunte quem em casa dormiu mal e ofereça uma pausa.
4. Convide alguém da casa para tomar um café com você.
5. Faça um pequeno ritual de "boa noite" com quem mora com você.
6. Escolha uma foto de família para colocar em um lugar visível.
7. Pergunte a alguém da casa qual é a parte mais difícil da semana dela.
8. Ofereça-se para fazer a tarefa doméstica que ninguém gosta de fazer.
9. Pergunte se alguém precisa de silêncio ou de companhia agora.
10. Prepare a mesa antes de todo mundo chegar para comer.
11. Pergunte a alguém da casa o que faria o dia dela mais leve.
12. Conte uma tradição da sua família que você quer manter viva.
13. Pergunte a alguém da casa qual comida a lembra de infância.
14. Escolha um dia da semana para ser "sem tela" em família.
15. Pergunte o que alguém da casa está com saudade de fazer.
16. Escreva um bilhete de agradecimento para alguém da casa.
17. Prepare a bolsa ou mochila de alguém para o dia seguinte.
18. Pergunte a alguém da casa como você pode ajudá-la amanhã de manhã.
19. Faça uma pequena reforma de humor: coloque uma música que todos gostam.
20. Pergunte qual é o sonho de viagem de alguém da sua família.
21. Ligue para um parente que você não vê há meses.
22. Pergunte a um avô ou avó uma lembrança de quando ele era jovem.
23. Peça a um familiar mais velho para contar uma história antiga.
24. Envie uma mensagem para um tio ou tia que você quase não fala.
25. Pergunte a um irmão ou irmã como ele está de verdade.
26. Reserve 10 minutos para conversar com um irmão sem falar de logística.
27. Escreva uma lembrança boa que você tem de um primo ou prima.
28. Pergunte a um sobrinho o que ele está aprendendo na escola.
29. Envie uma mensagem de bom dia para um familiar que mora sozinho.
30. Pergunte a alguém da família mais velha um conselho sobre algo real.
31. Escolha uma pessoa da família para visitar quando for possível.
32. Marque uma ligação de vídeo com um parente distante.
33. Pergunte a um familiar como ele conheceu seu cônjuge ou parceiro.
34. Pergunte qual foi a decisão mais difícil que um familiar já tomou.
35. Anote uma coisa que você admira em um familiar e diga a ele.
36. Agradeça a um familiar por algo que ele fez há muito tempo.
37. Pergunte a um familiar o que ele gostaria que você soubesse.
38. Reserve um tempo para organizar fotos antigas da família.
39. Escolha uma foto antiga e mande para a pessoa que aparece nela.
40. Pergunte a alguém da família qual música lembra a infância dela.
41. Grave um áudio contando uma lembrança boa para um familiar.
42. Pergunte a um familiar sobre um lugar onde ele cresceu.
43. Pergunte a alguém mais velho da família como era a vida antes.
44. Escreva uma pergunta que você nunca fez a um familiar e faça hoje.
45. Convide a família para uma refeição simples neste fim de semana.
46. Planeje uma atividade gratuita para fazer com a família.
47. Escolha um jogo de tabuleiro ou de carta para jogar em família.
48. Reserve uma noite para cozinhar juntos, mesmo que seja simples.
49. Escolha um filme ou série para assistir junto com alguém da casa.
50. Faça uma caminhada curta com quem mora com você.
51. Organize um piquenique simples com a família.
52. Proponha uma manhã sem compromissos para ficar em casa com a família.
53. Escolha uma atividade que toda a família goste e proponha para o fim de semana.
54. Convide a família para uma roda de conversa depois do jantar.
55. Ajude a organizar um quarto ou espaço comum sem ser pedido.
56. Guarde as roupas de alguém da casa sem que peçam.
57. Troque a roupa de cama de alguém da casa como gentileza.
58. Prepare o almoço de amanhã hoje, se fizer sentido.
59. Organize a geladeira ou despensa em conjunto com a família.
60. Assuma uma tarefa doméstica extra hoje sem reclamar.
61. Verifique se algo importante da casa precisa de manutenção e avise.
62. Conserte algo pequeno que está incomodando a família há dias.
63. Organize os documentos importantes da família em um lugar seguro.
64. Confira se as contas da casa estão em dia e avise se não.
65. Planeje com a família um pequeno objetivo para o mês.
66. Pergunte à família o que está funcionando bem na rotina de casa.
67. Pergunte à família o que poderia ser diferente na rotina de casa.
68. Reveja com a família as tarefas domésticas e ajuste o que for injusto.
69. Escolha, em conjunto, uma regra de casa para revisar.
70. Combine com a família um horário sem celular durante uma refeição.
71. Elogie sinceramente algo que um familiar fez recentemente.
72. Reconheça o esforço de alguém da casa em voz alta.
73. Diga a alguém da família por que você tem orgulho dela.
74. Comemore, mesmo que simples, uma conquista pequena de alguém da casa.
75. Diga "eu percebi o esforço que você fez" para alguém da família.
76. Diga a um familiar uma qualidade específica que você vê nele.
77. Escreva um bilhete dizendo o que você mais gosta em alguém da casa.
78. Diga a alguém da família algo que você nunca disse antes.
79. Agradeça a alguém da casa por algo que ela faz sem ser notada.
80. Reconheça publicamente uma conquista de um familiar, se fizer sentido. 📱
81. Ofereça ajuda a alguém da família antes que ela peça.
82. Perceba se alguém da casa está sobrecarregado e assuma algo por ela.
83. Prepare um chá ou bebida para alguém que está cansado.
84. Cubra uma tarefa de alguém da casa hoje, se possível.
85. Ofereça-se para cuidar de algo enquanto alguém da família descansa.
86. Dê um tempo livre a alguém da casa hoje, mesmo que curto.
87. Ajude alguém da família com algo que ela vem adiando.
88. Pergunte a alguém da casa se ela precisa de um dia mais leve.
89. Faça companhia a alguém da família que está em um momento difícil.
90. Ofereça escuta, sem julgamento, para alguém da família hoje.
91. Guarde o celular durante uma refeição inteira em família.
92. Faça uma pergunta diferente durante o jantar hoje.
93. Proponha que cada um conte uma coisa boa do dia à mesa.
94. Proponha que cada um conte um desafio do dia à mesa.
95. Combine com a família uma pergunta fixa para o jantar de hoje.
96. Escute uma história de alguém da casa até o fim, sem interromper.
97. Deixe alguém da família terminar de falar antes de responder.
98. Evite corrigir alguém da família em público hoje.
99. Peça desculpas a um familiar se existir algo pendente entre vocês.
100. Resolva com respeito uma pequena mágoa dentro de casa.
101. Reconheça um erro seu com um familiar, sem se justificar demais.
102. Escute o ponto de vista de um familiar mesmo discordando.
103. Evite uma discussão desnecessária com alguém da família hoje.
104. Troque uma reclamação por um pedido claro com alguém da casa.
105. Diga "eu entendo" antes de dar sua opinião para um familiar.
106. Pergunte "você quer conselho ou só quer que eu escute?" a um familiar.
107. Confirme um compromisso importante da família para os próximos dias.
108. Adicione à agenda um evento familiar que ainda não está marcado.
109. Planeje com antecedência algo que a família precisa organizar.
110. Verifique se algum documento da família está perto de vencer.
111. Organize uma pasta com informações importantes da família.
112. Prepare com antecedência algo que vai facilitar a semana da família.
113. Combine com a família os planos para o próximo feriado.
114. Reserve um horário fixo na semana só para a família.
115. Proponha um pequeno ritual semanal para a família.
116. Escolha um dia do mês para uma atividade especial em família.
117. Guarde um bom momento de hoje em um diário ou álbum da família.
118. Fotografe um momento simples e espontâneo da família hoje. 📱
119. Grave um vídeo curto de um momento bom em família.
120. Comece uma pequena coleção de memórias da família, mesmo que informal.
121. Escreva uma carta para ser lida por um familiar no futuro.
122. Peça a um familiar para escrever algo que você possa guardar.
123. Pergunte a alguém da família o que ela gostaria de ser lembrada por fazer.
124. Reserve um momento para relembrar uma viagem em família.
125. Reveja fotos antigas com alguém da família e conte as histórias.
126. Pergunte a alguém da casa qual é a lembrança mais feliz que ela tem.
127. Compartilhe com a família uma lembrança que você valoriza muito.
128. Pergunte a um familiar sobre um momento em que ele se sentiu orgulhoso.
129. Conte para a família uma coisa boa que aconteceu com você hoje.
130. Pergunte a um familiar sobre algo que ele gostaria de aprender.
131. Ofereça-se para ensinar algo simples a um familiar.
132. Aprenda algo novo com um familiar mais experiente.
133. Descubra uma habilidade escondida de alguém da sua família.
134. Pergunte a um familiar sobre um hobby que ele tem ou tinha.
135. Convide um familiar para fazer algo que ele gosta com você.
136. Apoie um familiar em um objetivo que ele está tentando alcançar.
137. Pergunte a um familiar como está indo um projeto pessoal dele.
138. Incentive um familiar que está enfrentando um momento difícil.
139. Diga a um familiar que você acredita na capacidade dele.
140. Ofereça-se para acompanhar um familiar em algo importante.
141. Pergunte a um familiar se ele precisa de ajuda com alguma decisão.
142. Compartilhe com um familiar uma preocupação sua, se fizer sentido.
143. Peça um conselho sincero a um familiar em quem você confia.
144. Divida com a família uma boa notícia assim que possível.
145. Convide a família para comemorar uma pequena vitória sua.
146. Diga à família como o apoio dela fez diferença para você.
147. Agradeça à sua família por algo que ela representa na sua vida.
148. Escreva uma frase que resuma o que sua família significa para você.
149. Faça hoje uma coisa simples que facilite a vida de toda a casa.
150. Termine o dia perguntando a cada pessoa da casa como ela está.
`;

// ===========================================================================
// FILHOS — relationships:['filho','neto'] (hard filter) + par genérico sem
// relationships (seção 20 do pedido: nunca presumir que o usuário tem filhos).
// ~50 + ~50.
// ===========================================================================

const CHILDREN_SPECIFIC_RAW = `
1. Passe 10 minutos brincando com {pessoa} sem pegar no celular.
2. Pergunte a {pessoa} o que foi a melhor parte do dia dela.
3. Deixe {pessoa} escolher a brincadeira de hoje.
4. Ensine algo simples e novo para {pessoa}.
5. Peça para {pessoa} te ensinar algo que ela sabe fazer.
6. Leia uma história com {pessoa} antes de dormir.
7. Desenhe ou pinte algo simples junto com {pessoa}.
8. Pergunte a {pessoa} sobre o brinquedo ou jogo favorito dela agora.
9. Elogie algo específico que {pessoa} fez hoje.
10. Diga a {pessoa} uma coisa que você admira nela.
11. Faça uma pergunta boba e divertida para {pessoa} responder.
12. Dance uma música com {pessoa}.
13. Ajude {pessoa} com o dever de casa, se ela precisar.
14. Pergunte a {pessoa} o que ela está aprendendo na escola essa semana.
15. Prepare um lanche simples junto com {pessoa}.
16. Deixe {pessoa} ajudar você em uma tarefa simples da casa.
17. Conte para {pessoa} uma história da sua própria infância.
18. Pergunte a {pessoa} qual é o sonho dela para quando crescer.
19. Faça uma caminhada curta com {pessoa}.
20. Brinque de faz de conta com {pessoa} por alguns minutos.
21. Monte um quebra-cabeça ou jogo de tabuleiro com {pessoa}.
22. Pergunte a {pessoa} o que a deixou feliz hoje.
23. Pergunte a {pessoa} o que a deixou triste ou brava hoje.
24. Escute {pessoa} contar uma história sem interromper.
25. Tire uma foto espontânea com {pessoa} hoje.
26. Deixe {pessoa} escolher a música para ouvirem juntos.
27. Faça uma pequena surpresa simples para {pessoa}.
28. Pergunte a {pessoa} sobre um amigo importante da vida dela.
29. Dê atenção total a {pessoa} por 10 minutos, sem distrações.
30. Diga "eu te amo" para {pessoa} hoje, se ainda não disse.
31. Abrace {pessoa}, se ela topar.
32. Pergunte a {pessoa} o que ela gostaria de fazer no fim de semana.
33. Deixe {pessoa} contar uma piada ou uma história engraçada.
34. Pergunte a {pessoa} qual foi a coisa mais legal que ela viu hoje.
35. Ajude {pessoa} a organizar o quarto ou a mochila dela.
36. Cozinhe algo simples com a ajuda de {pessoa}.
37. Pergunte a {pessoa} sobre um desafio que ela está enfrentando.
38. Reconheça um esforço de {pessoa}, mesmo que o resultado não tenha sido perfeito.
39. Pergunte a {pessoa} o que ela precisa de você agora.
40. Faça um pequeno jogo de perguntas e respostas com {pessoa}.
41. Convide {pessoa} para uma atividade ao ar livre, se o tempo ajudar.
42. Escreva um bilhete carinhoso para {pessoa} encontrar depois.
43. Pergunte a {pessoa} sobre um professor ou amigo que ela gosta.
44. Deixe {pessoa} escolher o que vão fazer juntos por 15 minutos.
45. Pergunte a {pessoa} algo sobre o que ela está curiosa.
46. Comemore com {pessoa} uma pequena conquista dela.
47. Peça desculpas a {pessoa} se ficou impaciente com ela recentemente.
48. Pergunte a {pessoa} como foi a última vez que ela se sentiu orgulhosa.
49. Prepare o ambiente para {pessoa} dormir mais tranquila hoje.
50. Termine o dia dizendo a {pessoa} algo positivo sobre ela.
`;

const CHILDREN_GENERIC_RAW = `
1. Passe 10 minutos com alguém importante pra você sem pegar no celular.
2. Pergunte a alguém jovem da sua vida o que foi a melhor parte do dia dela.
3. Deixe outra pessoa escolher a atividade de hoje.
4. Ensine algo simples e novo para alguém.
5. Peça para alguém te ensinar algo que ela sabe fazer.
6. Leia algumas páginas de um livro com alguém antes de dormir.
7. Desenhe ou faça algo criativo junto com alguém que você gosta.
8. Pergunte a alguém sobre o que a diverte agora.
9. Elogie algo específico que alguém fez hoje.
10. Diga a alguém uma coisa que você admira nela.
11. Faça uma pergunta boba e divertida para alguém responder.
12. Dance uma música com alguém.
13. Ajude alguém com uma tarefa que ela precisa fazer.
14. Pergunte a alguém o que ela está aprendendo essa semana.
15. Prepare um lanche simples para compartilhar com alguém.
16. Deixe alguém ajudar você em uma tarefa simples.
17. Conte para alguém uma história da sua própria infância.
18. Pergunte a alguém qual é um sonho dela para o futuro.
19. Faça uma caminhada curta com alguém.
20. Brinque ou jogue algo leve com alguém por alguns minutos.
21. Monte um quebra-cabeça ou jogo com alguém.
22. Pergunte a alguém o que a deixou feliz hoje.
23. Pergunte a alguém o que a deixou triste ou incomodada hoje.
24. Escute alguém contar uma história sem interromper.
25. Tire uma foto espontânea com alguém importante hoje.
26. Deixe alguém escolher a música para ouvirem juntos.
27. Faça uma pequena surpresa simples para alguém.
28. Pergunte a alguém sobre um amigo importante da vida dela.
29. Dê atenção total a alguém por 10 minutos, sem distrações.
30. Diga a alguém que você gosta dela, se ainda não disse hoje.
31. Ofereça um abraço a alguém, se fizer sentido.
32. Pergunte a alguém o que gostaria de fazer no fim de semana.
33. Deixe alguém contar uma piada ou uma história engraçada.
34. Pergunte a alguém qual foi a coisa mais legal que ela viu hoje.
35. Ajude alguém a organizar um espaço ou uma tarefa pendente.
36. Cozinhe algo simples com a ajuda de alguém.
37. Pergunte a alguém sobre um desafio que ela está enfrentando.
38. Reconheça um esforço de alguém, mesmo que o resultado não tenha sido perfeito.
39. Pergunte a alguém o que ela precisa de você agora.
40. Faça um pequeno jogo de perguntas e respostas com alguém.
41. Convide alguém para uma atividade ao ar livre, se o tempo ajudar.
42. Escreva um bilhete carinhoso para alguém encontrar depois.
43. Pergunte a alguém sobre uma pessoa que ela admira.
44. Deixe alguém escolher o que vão fazer juntos por 15 minutos.
45. Pergunte a alguém algo sobre o que ela está curiosa.
46. Comemore com alguém uma pequena conquista dela.
47. Peça desculpas a alguém se ficou impaciente recentemente.
48. Pergunte a alguém como foi a última vez que ela se sentiu orgulhosa.
49. Prepare algo simples para o dia de alguém ficar mais tranquilo.
50. Termine o dia dizendo a alguém algo positivo sobre ela.
`;

// ===========================================================================
// PARCEIRO — relationships:['conjuge','companheiro','namorado','noivo'] + par
// genérico sem relationships (seção 5/20: nunca presumir que existe parceiro).
// ~50 + ~50.
// ===========================================================================

const PARTNER_SPECIFIC_RAW = `
1. Pergunte a {pessoa} como ela realmente está, sem pressa para responder.
2. Prepare algo simples que {pessoa} gosta, sem ocasião especial.
3. Deixe um bilhete carinhoso para {pessoa} encontrar durante o dia.
4. Elogie algo específico em {pessoa} hoje, não só "você é ótimo(a)".
5. Pergunte a {pessoa} o que faria a semana dela mais leve.
6. Ofereça 15 minutos de atenção total a {pessoa}, sem celular.
7. Pergunte a {pessoa} qual é um sonho que ela ainda não realizou.
8. Assuma uma tarefa que normalmente é de {pessoa}, sem avisar antes.
9. Diga a {pessoa} um motivo específico pelo qual você é grato(a) por ela.
10. Planeje uma surpresa pequena e simples para {pessoa}.
11. Pergunte a {pessoa} como você pode apoiá-la em algo que ela está enfrentando.
12. Envie uma mensagem carinhosa para {pessoa} no meio do dia.
13. Prepare um momento a dois, mesmo que seja curto.
14. Pergunte a {pessoa} qual foi a parte mais difícil da semana dela.
15. Escute {pessoa} contar sobre o dia sem tentar resolver nada, só ouvindo.
16. Toque em {pessoa} com carinho — segurar a mão já basta.
17. Diga a {pessoa} algo que você nunca disse antes.
18. Reserve um tempo sem distrações para conversar com {pessoa}.
19. Pergunte a {pessoa} o que ela sente que está faltando na rotina de vocês.
20. Faça um elogio sincero sobre como {pessoa} lida com algo difícil.
21. Proponha um encontro simples com {pessoa}, mesmo que seja em casa.
22. Pergunte a {pessoa} qual memória de vocês ela mais gosta de lembrar.
23. Cozinhe ou prepare algo especial para {pessoa} hoje.
24. Pergunte a {pessoa} se ela precisa de mais espaço ou mais presença hoje.
25. Reconheça algo que {pessoa} fez recentemente que passou despercebido.
26. Pergunte a {pessoa} o que a faria se sentir mais amada esta semana.
27. Convide {pessoa} para fazer algo que ela gosta e você nem tanto.
28. Diga a {pessoa} uma qualidade dela que você admira profundamente.
29. Combine com {pessoa} uma pausa sem celular durante uma refeição.
30. Pergunte a {pessoa} sobre um objetivo pessoal que ela está buscando.
31. Apoie {pessoa} em uma decisão que ela está tentando tomar.
32. Pergunte a {pessoa} o que a deixou desconfortável recentemente, com abertura.
33. Peça desculpas a {pessoa} se existir alguma coisa pendente entre vocês.
34. Pergunte a {pessoa} como foi conhecer você, do ponto de vista dela.
35. Relembre com {pessoa} um momento bom do início da relação de vocês.
36. Envie uma música para {pessoa} que descreva como você se sente hoje.
37. Pergunte a {pessoa} o que ela gostaria de fazer juntos este mês.
38. Marque um momento no calendário só para vocês dois.
39. Pergunte a {pessoa} se ela sente que está sendo ouvida ultimamente.
40. Ofereça-se para cuidar de algo que sobrecarrega {pessoa}.
41. Diga a {pessoa} "eu escolho você" de alguma forma hoje.
42. Pergunte a {pessoa} o que mudou nela nos últimos anos que você admira.
43. Faça uma pergunta sobre os planos futuros de vocês juntos.
44. Pergunte a {pessoa} qual foi o gesto mais gentil que você já teve com ela.
45. Reconheça, em voz alta, o parceiro ou parceira que {pessoa} é.
46. Pergunte a {pessoa} algo sobre a família dela que você nunca perguntou.
47. Escreva três coisas que você admira em {pessoa} e compartilhe uma delas.
48. Pergunte a {pessoa} o que ela precisa hoje: conversa, silêncio ou colo.
49. Convide {pessoa} para uma caminhada curta só para conversar.
50. Termine o dia dizendo a {pessoa} algo que você é grato(a) nela.
`;

const PARTNER_GENERIC_RAW = `
1. Pergunte a alguém importante pra você como ela realmente está, sem pressa para responder.
2. Prepare algo simples que alguém gosta, sem ocasião especial.
3. Deixe um bilhete carinhoso para alguém encontrar durante o dia.
4. Elogie algo específico em alguém hoje, não só "você é ótimo(a)".
5. Pergunte a alguém o que faria a semana dela mais leve.
6. Ofereça 15 minutos de atenção total a alguém, sem celular.
7. Pergunte a alguém qual é um sonho que ela ainda não realizou.
8. Assuma uma tarefa que normalmente é de outra pessoa, sem avisar antes.
9. Diga a alguém um motivo específico pelo qual você é grato(a) por ela.
10. Planeje uma surpresa pequena e simples para alguém importante.
11. Pergunte a alguém como você pode apoiá-la em algo que ela está enfrentando.
12. Envie uma mensagem carinhosa para alguém no meio do dia.
13. Prepare um momento a sós com alguém, mesmo que seja curto.
14. Pergunte a alguém qual foi a parte mais difícil da semana dela.
15. Escute alguém contar sobre o dia sem tentar resolver nada, só ouvindo.
16. Ofereça um gesto de carinho simples a alguém, se fizer sentido.
17. Diga a alguém algo que você nunca disse antes.
18. Reserve um tempo sem distrações para conversar com alguém importante.
19. Pergunte a alguém o que ela sente que está faltando na rotina de vocês.
20. Faça um elogio sincero sobre como alguém lida com algo difícil.
21. Proponha um encontro simples com alguém, mesmo que seja em casa.
22. Pergunte a alguém qual memória de vocês ela mais gosta de lembrar.
23. Prepare algo especial para alguém importante hoje.
24. Pergunte a alguém se ela precisa de mais espaço ou mais presença hoje.
25. Reconheça algo que alguém fez recentemente que passou despercebido.
26. Pergunte a alguém o que a faria se sentir mais valorizada esta semana.
27. Convide alguém para fazer algo que ela gosta e você nem tanto.
28. Diga a alguém uma qualidade dela que você admira profundamente.
29. Combine com alguém uma pausa sem celular durante uma refeição.
30. Pergunte a alguém sobre um objetivo pessoal que ela está buscando.
31. Apoie alguém em uma decisão que ela está tentando tomar.
32. Pergunte a alguém o que a deixou desconfortável recentemente, com abertura.
33. Peça desculpas a alguém se existir alguma coisa pendente entre vocês.
34. Pergunte a alguém como foi conhecer você, do ponto de vista dela.
35. Relembre com alguém um momento bom do início da amizade ou relação de vocês.
36. Envie uma música para alguém que descreva como você se sente hoje.
37. Pergunte a alguém o que ela gostaria de fazer juntos este mês.
38. Marque um momento no calendário só para vocês.
39. Pergunte a alguém se ela sente que está sendo ouvida ultimamente.
40. Ofereça-se para cuidar de algo que sobrecarrega alguém importante.
41. Diga a alguém, de alguma forma, que você escolhe tê-la na sua vida.
42. Pergunte a alguém o que mudou nela nos últimos anos que você admira.
43. Faça uma pergunta sobre os planos futuros de alguém.
44. Pergunte a alguém qual foi o gesto mais gentil que você já teve com ela.
45. Reconheça, em voz alta, o que alguém importante representa pra você.
46. Pergunte a alguém algo sobre a família dela que você nunca perguntou.
47. Escreva três coisas que você admira em alguém e compartilhe uma delas.
48. Pergunte a alguém o que ela precisa hoje: conversa, silêncio ou companhia.
49. Convide alguém para uma caminhada curta só para conversar.
50. Termine o dia dizendo a alguém algo que você é grato(a) nela.
`;

// ===========================================================================
// PAIS / FIGURAS IMPORTANTES — relationships:['pai','mae'] + genérico "alguém
// que teve papel importante na sua formação" (seção 6: nunca presumir presença
// de pai/mãe). ~30 + ~30.
// ===========================================================================

const PARENTS_SPECIFIC_RAW = `
1. Ligue para {pessoa} só para saber como ela está.
2. Pergunte a {pessoa} uma lembrança da juventude dela.
3. Agradeça a {pessoa} por algo específico que ela fez por você.
4. Pergunte a {pessoa} um conselho sobre algo que você está vivendo.
5. Diga a {pessoa} uma coisa que você aprendeu com ela.
6. Pergunte a {pessoa} como era a vida dela na sua idade.
7. Envie uma mensagem contando algo bom que aconteceu com você hoje.
8. Pergunte a {pessoa} sobre um sonho que ela teve e não realizou.
9. Pergunte a {pessoa} qual foi a decisão mais difícil que ela já tomou.
10. Diga a {pessoa} que você tem orgulho de quem ela é.
11. Pergunte a {pessoa} sobre uma tradição de família que ela quer manter.
12. Ofereça ajuda a {pessoa} com algo que ela tem adiado.
13. Pergunte a {pessoa} como ela está de saúde, com atenção de verdade.
14. Peça a {pessoa} para contar uma história que você nunca ouviu.
15. Envie uma foto antiga para {pessoa} e pergunte sobre o momento.
16. Pergunte a {pessoa} o que ela gostaria de fazer mais vezes com você.
17. Diga a {pessoa} algo que você nunca agradeceu antes.
18. Visite {pessoa}, se for possível e conveniente.
19. Pergunte a {pessoa} sobre os pais ou avós dela.
20. Reserve um tempo ao telefone com {pessoa}, sem pressa.
21. Pergunte a {pessoa} o que ela sente falta de fazer com você.
22. Diga a {pessoa} uma qualidade dela que moldou quem você é.
23. Pergunte a {pessoa} como ela lidava com dificuldades quando você era criança.
24. Peça perdão a {pessoa} por algo, se fizer sentido.
25. Pergunte a {pessoa} qual conselho ela daria pro você de hoje.
26. Compartilhe com {pessoa} uma preocupação sua, se você se sentir à vontade.
27. Pergunte a {pessoa} sobre um momento em que ela se sentiu orgulhosa de você.
28. Ofereça companhia a {pessoa} por alguns minutos hoje.
29. Pergunte a {pessoa} o que ela gostaria que você soubesse sobre a vida dela.
30. Termine o dia mandando uma mensagem carinhosa para {pessoa}.
`;

const PARENTS_GENERIC_RAW = `
1. Ligue para alguém que teve um papel importante na sua formação.
2. Pense em uma lembrança boa de alguém que ajudou a formar quem você é.
3. Agradeça a alguém que foi importante na sua criação ou formação.
4. Peça um conselho a alguém mais velho em quem você confia.
5. Diga a alguém uma coisa que você aprendeu com ela.
6. Pergunte a alguém mais velho como era a vida dela na sua idade.
7. Envie uma mensagem contando algo bom que aconteceu com você hoje.
8. Pense em um sonho que alguém importante para você teve e talvez não realizou.
9. Pergunte a alguém sobre a decisão mais difícil que ela já tomou.
10. Diga a alguém que você tem orgulho de quem ela é.
11. Pense em uma tradição de família que você quer manter viva.
12. Ofereça ajuda a alguém mais velho com algo que ela tem adiado.
13. Pergunte a alguém importante como ela está de saúde, com atenção de verdade.
14. Peça a alguém para contar uma história que você nunca ouviu.
15. Reveja uma foto antiga e lembre de um momento importante.
16. Pense no que você gostaria de fazer mais vezes com alguém que te formou.
17. Diga a alguém algo que você nunca agradeceu antes.
18. Visite alguém importante, se for possível e conveniente.
19. Pergunte a um familiar mais velho sobre os pais ou avós dele.
20. Reserve um tempo ao telefone com alguém importante, sem pressa.
21. Pense no que você sente falta de fazer com alguém que te formou.
22. Reconheça uma qualidade que moldou quem você é hoje.
23. Pense em como alguém importante lidava com dificuldades quando você era jovem.
24. Peça perdão a alguém, se fizer sentido.
25. Pense em qual conselho alguém mais velho daria pro você de hoje.
26. Compartilhe com alguém de confiança uma preocupação sua.
27. Pense em um momento em que alguém se sentiu orgulhoso de você.
28. Ofereça companhia a alguém mais velho por alguns minutos hoje.
29. Pense no que alguém importante gostaria que você soubesse sobre a vida dela.
30. Termine o dia mandando uma mensagem carinhosa para alguém que te formou.
`;

// ===========================================================================
// AMIGOS — relationships:['amigo'] quando o texto pede explicitamente um amigo
// específico; sem relationships quando o texto já é neutro o bastante pra
// qualquer amizade (mais flexível que filho/parceiro/pai — "amigo" é uma
// categoria menos sensível a presumir). ~100.
// ===========================================================================

const FRIENDS_RAW = `
1. Mande uma mensagem para um amigo que você não fala há tempos.
2. Pergunte a um amigo como ele está de verdade, além do "tudo bem".
3. Ligue para um amigo antigo, mesmo que rápido.
4. Marque um encontro com um amigo, mesmo que simples.
5. Agradeça a um amigo por algo específico que ele fez por você.
6. Envie uma mensagem contando que você está pensando em um amigo.
7. Pergunte a um amigo sobre um projeto ou sonho que ele está buscando.
8. Compartilhe uma boa notícia com um amigo. 📱
9. Pergunte a um amigo se ele precisa de ajuda com alguma coisa.
10. Ofereça ajuda a um amigo em algo que ele está enfrentando.
11. Envie uma foto ou lembrança que lembre um momento com um amigo.
12. Pergunte a um amigo qual foi a melhor parte da semana dele.
13. Parabenize um amigo por uma conquista, mesmo pequena.
14. Reconecte-se com um amigo de uma fase antiga da sua vida.
15. Convide um amigo para fazer algo simples juntos.
16. Pergunte a um amigo o que o deixaria mais animado essa semana.
17. Diga a um amigo por que a amizade dele importa pra você.
18. Envie um áudio em vez de só texto para um amigo.
19. Pergunte a um amigo como ele está lidando com algo difícil.
20. Escute um amigo contar uma história sem tentar resolver o problema dele.
21. Recomende algo que você gostou para um amigo que combina com o gosto dele. 📱
22. Pergunte a um amigo sobre um lugar que ele quer conhecer.
23. Envie uma mensagem de apoio para um amigo em um momento difícil. 📱
24. Pergunte a um amigo o que faria a semana dele mais leve.
25. Convide um amigo para uma chamada de vídeo curta.
26. Pergunte a um amigo sobre uma memória boa que vocês compartilham.
27. Compartilhe uma memória boa com um amigo. 📱
28. Pergunte a um amigo se ele quer só desabafar ou quer conselho.
29. Faça companhia a um amigo que está sozinho, mesmo que à distância.
30. Convide um amigo para uma atividade que vocês faziam antes e pararam.
31. Pergunte a um amigo qual foi a última vez que ele riu muito.
32. Envie uma mensagem de bom dia para um amigo especial.
33. Reconheça publicamente uma conquista de um amigo. 📱
34. Pergunte a um amigo sobre um hobby novo que ele começou.
35. Peça desculpas a um amigo, se existir algo pendente entre vocês.
36. Resolva com respeito uma pequena mágoa com um amigo.
37. Diga a um amigo que você sente falta dele.
38. Pergunte a um amigo o que ele está achando difícil ultimamente.
39. Faça uma pergunta que você nunca fez a um amigo antigo.
40. Convide um amigo para conhecer algo novo junto.
41. Pergunte a um amigo qual foi o conselho mais importante que já recebeu.
42. Ofereça um lugar pra ficar ou ajuda prática a um amigo, se puder.
43. Compartilhe com um amigo algo que você aprendeu recentemente. 📱
44. Pergunte a um amigo se ele tem tempo pra conversar essa semana.
45. Pergunte a um amigo como está a família dele.
46. Envie para um amigo uma música que lembre a amizade de vocês.
47. Pergunte a um amigo o que ele gostaria de fazer que nunca fez.
48. Marque uma data futura para reencontrar um amigo distante.
49. Pergunte a um amigo qual foi um momento em que ele se sentiu apoiado por você.
50. Diga a um amigo algo que você admira nele.
51. Pergunte a um colega de trabalho como está sua semana.
52. Cumprimente pelo nome alguém que você encontra com frequência.
53. Dê bom dia a alguém que costuma passar despercebido no seu dia.
54. Faça uma pergunta genuína a um vizinho sobre a vida dele.
55. Ofereça ajuda a um vizinho com alguma coisa simples.
56. Reconecte-se com alguém de uma fase antiga que você perdeu contato.
57. Envie uma mensagem para alguém que está começando algo novo.
58. Pergunte a alguém como foi um evento importante que aconteceu ontem.
59. Compartilhe uma oportunidade que pode ajudar um amigo. 📱
60. Indique o trabalho de um amigo pra quem possa se interessar. 📱
61. Faça uma pergunta a um amigo sobre um sonho antigo dele.
62. Pergunte a um amigo qual foi a viagem favorita da vida dele.
63. Pergunte a um amigo qual comida lembra a infância dele.
64. Pergunte a um amigo qual música sempre melhora o humor dele.
65. Descubra algo novo sobre um amigo que você conhece há anos.
66. Convide um amigo para uma refeição simples, mesmo que em casa.
67. Envie um convite espontâneo para um amigo fazer algo hoje.
68. Pergunte a um amigo o que ele gostaria de comemorar essa semana.
69. Faça uma surpresa pequena para um amigo.
70. Deixe um bilhete ou mensagem carinhosa para um amigo.
71. Pergunte a um amigo se ele topa criar um hábito juntos.
72. Combine um horário fixo pra falar com um amigo mais vezes.
73. Pergunte a um amigo qual foi a última vez que ele pediu ajuda.
74. Ofereça-se para ouvir um amigo sem interromper.
75. Pergunte a um amigo o que costuma tirar o sono dele.
76. Convide um amigo para desabafar, se ele quiser.
77. Diga a um amigo algo que você nunca disse, mas sente.
78. Escolha uma pessoa para fortalecer a amizade essa semana.
79. Pergunte a um amigo distante como ele está se adaptando à rotina atual.
80. Envie uma mensagem de incentivo para um amigo que está desanimado. 📱
81. Comemore com um amigo uma vitória dele, mesmo pequena. 📱
82. Pergunte a um amigo sobre um livro, filme ou série que ele recomendaria.
83. Ofereça-se para apresentar um amigo a alguém que possa ajudá-lo. 📱
84. Pergunte a um amigo como ele está cuidando de si mesmo ultimamente.
85. Pergunte a um amigo se ele quer companhia para algo hoje.
86. Escreva pra um amigo por que ele é importante na sua vida.
87. Pergunte a um amigo o que mudou na vida dele recentemente.
88. Reconheça o esforço de um amigo em algo que ele está tentando.
89. Convide um amigo para participar de algo que você está fazendo.
90. Pergunte a um amigo qual foi um erro que ele aprendeu bastante.
91. Faça uma gentileza por um amigo sem avisar que foi você.
92. Pergunte a um amigo o que ele espera dos próximos meses.
93. Compartilhe com um amigo uma dificuldade sua, se você confiar nele.
94. Pergunte a um amigo se ele sente que está tendo tempo pra ele mesmo.
95. Convide um amigo pra experimentar algo novo com você.
96. Pergunte a um amigo o que o faz sentir que a amizade vale a pena.
97. Reconecte um grupo de amigos que não se fala há tempos.
98. Organize, mesmo que informalmente, um encontro entre amigos.
99. Agradeça a um amigo por estar presente em um momento difícil.
100. Termine o dia mandando uma mensagem simples pra um amigo: "pensando em você".
`;

// ===========================================================================
// CHUVA — weatherTags:['rain','indoor']. O clima muda a NATUREZA da ação
// (seção 8: não é só "está chovendo", é uma sugestão que só faz sentido por
// causa da chuva) — organização, leitura, família, autocuidado dentro de casa.
// ~80.
// ===========================================================================

const RAIN_HEALTH_RAW = `
1. Aproveite o som da chuva para fazer 5 minutos de respiração tranquila.
2. Faça um alongamento completo dentro de casa enquanto chove lá fora.
3. Prepare uma bebida quente e aproveite um momento de pausa.
4. Faça uma sequência de movimentos leves na sala, já que está chovendo.
5. Aproveite a chuva como desculpa pra descansar um pouco mais hoje.
6. Faça 10 minutos de alongamento ouvindo o barulho da chuva.
7. Tome um banho mais demorado e relaxante num dia chuvoso.
8. Aproveite o dia de chuva para dormir um pouco mais cedo.
9. Prepare uma sopa ou algo quente para uma refeição de dia chuvoso.
10. Faça uma pausa para simplesmente observar a chuva caindo por 2 minutos.
11. Use o dia chuvoso para fazer alongamentos que você vem adiando.
12. Aproveite o clima mais fresco da chuva para dormir uma soneca curta.
13. Faça uma caminhada curta dentro de casa enquanto espera a chuva passar.
14. Prepare um chá e aproveite o clima para relaxar por alguns minutos.
15. Use a chuva como sinal para desacelerar o ritmo do seu dia.
16. Faça um automassagem nos ombros enquanto ouve a chuva.
17. Aproveite o dia chuvoso para ir mais devagar em tudo que fizer.
18. Troque uma atividade agitada por algo calmo, já que está chovendo.
19. Faça exercícios de respiração ao som da chuva antes de dormir.
20. Aproveite o dia de chuva para cuidar de você sem pressa.
21. Prepare uma refeição quentinha e aproveite sem pressa por causa da chuva.
22. Use o som da chuva como fundo para uma meditação curta.
23. Reserve um tempo extra pra descansar, já que sair está mais difícil.
24. Faça um ritual de autocuidado que você não costuma ter tempo pra fazer.
25. Aproveite o dia chuvoso pra cuidar da pele ou do cabelo com calma.
26. Faça uma pausa mais longa entre tarefas, aproveitando o clima mais calmo.
27. Prepare uma bebida quente pra tomar enquanto olha pela janela.
28. Use o dia de chuva pra ir com calma numa refeição, sem pressa.
29. Aproveite o clima pra fazer um alongamento de pescoço e ombros.
30. Deixe o dia de chuva ser mais lento e cuide do seu corpo nesse ritmo.
31. Aproveite o barulho da chuva para uma soneca curta e restauradora.
32. Faça um dia de cuidados simples: água, alongamento e descanso, sem sair de casa.
33. Prepare algo quente para tomar enquanto termina uma tarefa tranquila em casa.
34. Use o dia chuvoso pra reduzir o ritmo e prestar atenção em como você está.
35. Aproveite o clima mais frio da chuva pra dormir com mais conforto hoje.
36. Faça uma pausa de 5 minutos só pra ouvir a chuva, sem fazer nada.
37. Prepare um banho relaxante aproveitando que o dia está mais tranquilo.
38. Faça um alongamento das costas enquanto o dia de chuva passa.
39. Aproveite pra descansar os olhos das telas enquanto chove lá fora.
40. Termine o dia de chuva com um ritual calmo antes de dormir.
`;

const RAIN_FAMILY_RAW = `
1. Aproveite o dia de chuva para jogar um jogo de tabuleiro em família.
2. Organize um armário ou gaveta que você vem adiando, já que é dia de ficar em casa.
3. Assista a um filme com a família enquanto chove lá fora.
4. Prepare uma receita nova em casa aproveitando o dia chuvoso.
5. Conte histórias em família ao som da chuva.
6. Organize fotos antigas da família num dia chuvoso.
7. Aproveite a chuva pra fazer uma faxina leve e organizar a casa.
8. Monte um quebra-cabeça com quem estiver em casa.
9. Aproveite o dia chuvoso pra ensinar algo simples a uma criança da casa.
10. Cozinhe algo em família que exija mais tempo, já que ninguém vai sair.
11. Use o dia de chuva pra reorganizar um espaço comum da casa.
12. Aproveite pra ler um livro com alguém da família enquanto chove.
13. Faça uma tarde de jogos com a família por causa da chuva.
14. Prepare uma pipoca e assista algo em família num dia chuvoso.
15. Aproveite o dia mais parado pra ter uma conversa longa com a família.
16. Organize uma gaveta de papéis ou documentos importantes da casa.
17. Aproveite a chuva pra brincar dentro de casa com uma criança.
18. Faça uma limpeza organizada de um cômodo, aproveitando o dia em casa.
19. Prepare uma receita que a família toda gosta, já que estão todos em casa.
20. Aproveite pra desenhar ou pintar junto com alguém da família.
21. Organize as roupas de inverno ou de chuva da família.
22. Use o dia chuvoso pra planejar a semana com calma, em família.
23. Aproveite pra montar uma pequena "biblioteca" com os livros espalhados pela casa.
24. Faça uma tarde de artesanato simples com quem estiver em casa.
25. Aproveite a chuva pra revisar e organizar o armário de remédios da casa.
26. Prepare um chocolate quente pra compartilhar com a família.
27. Aproveite pra ensinar um jogo antigo pra uma criança da casa.
28. Use o dia de chuva pra separar roupas ou itens para doação.
29. Aproveite pra escrever, em família, uma lista de coisas para fazer num dia de sol.
30. Termine um dia de chuva com uma atividade tranquila e em conjunto com a família.
31. Reorganize a despensa ou a geladeira aproveitando o dia em casa.
32. Aproveite pra ensinar uma criança a jogar um jogo de cartas simples.
33. Prepare uma refeição mais elaborada com a ajuda de alguém da família.
34. Aproveite o dia chuvoso pra fazer uma sessão de perguntas e respostas em família.
35. Use o tempo em casa pra consertar algo pequeno que estava pendente.
36. Aproveite pra montar um álbum simples com fotos recentes da família.
37. Faça uma tarde de música em família, cada um escolhendo uma canção.
38. Aproveite a chuva pra revisar as tarefas domésticas da semana com calma.
39. Prepare uma sobremesa simples com quem estiver em casa.
40. Termine o dia de chuva com a família contando o que cada um mais gostou de fazer.
`;

// ===========================================================================
// FRIO — weatherTags:['cold','indoor']. ~50.
// ===========================================================================

const COLD_HEALTH_RAW = `
1. Prepare uma bebida quente antes de começar suas tarefas.
2. Faça um alongamento completo pra aquecer o corpo antes de sair da cama.
3. Vista uma roupa confortável e quentinha pra trabalhar ou descansar.
4. Aproveite o frio pra dormir um pouco mais cedo hoje.
5. Faça movimentos leves pra aquecer o corpo em vez de ficar parado.
6. Prepare uma sopa ou caldo quente para uma refeição do dia.
7. Aproveite o frio pra tomar um banho morno e relaxante.
8. Use uma manta ou cobertor extra pra ficar mais confortável hoje.
9. Faça uma bebida quente e aproveite um momento de pausa com calma.
10. Aproveite o frio pra fazer alongamentos das mãos e dos pés.
11. Prepare o quarto com antecedência pra dormir mais aquecido hoje.
12. Faça uma caminhada curta dentro de casa pra se aquecer.
13. Aproveite o dia frio pra descansar um pouco mais que o normal.
14. Prepare uma refeição quente e nutritiva pra hoje.
15. Use meias ou roupas mais quentes se estiver sentindo frio o dia todo.
16. Aproveite o frio pra fazer um automassagem nos ombros tensos.
17. Beba algo quente antes de uma tarefa que exige concentração.
18. Aproveite o clima frio pra ir com calma nas suas tarefas de hoje.
19. Faça uma pausa pra se aquecer antes de continuar uma atividade.
20. Termine o dia com uma bebida quente e um momento de descanso.
21. Aproveite o frio pra fazer um ritual de cuidado com a pele.
22. Prepare uma refeição reconfortante pra hoje.
23. Faça alongamentos de pescoço e ombros pra aliviar a tensão do frio.
24. Aproveite pra dormir com mais conforto, ajustando cobertores e travesseiros.
25. Termine o dia com um banho morno relaxante.
`;

const COLD_DEV_RAW = `
1. Aproveite o dia frio pra ficar em casa e organizar seus pensamentos.
2. Use o clima mais parado pra escrever sobre como você está se sentindo.
3. Aproveite o frio pra ler algumas páginas de um livro com calma.
4. Reserve um tempo pra planejar a semana num dia mais tranquilo de frio.
5. Aproveite o clima pra fazer uma pausa mais longa e reflexiva.
6. Use o dia frio pra organizar uma tarefa que você vem adiando.
7. Aproveite pra escrever três coisas que você é grato hoje, num dia mais lento.
8. Reserve um tempo pra pensar em uma meta pequena para essa semana.
9. Aproveite o clima frio pra reorganizar seu espaço de trabalho ou estudo.
10. Use um dia frio pra terminar algo que você começou e não finalizou.
11. Aproveite pra planejar com calma um objetivo pessoal.
12. Reserve um tempo pra revisar suas finanças num dia mais parado.
13. Aproveite o frio pra fazer uma leitura mais longa do que o normal.
14. Use o clima pra escrever uma carta ou mensagem que você vem adiando.
15. Aproveite um dia frio pra organizar fotos ou arquivos antigos.
16. Reserve um momento pra pensar em algo que você quer aprender.
17. Aproveite o clima mais calmo pra fazer uma reflexão sobre a semana.
18. Use o dia frio pra escrever sobre uma conquista recente, mesmo pequena.
19. Aproveite pra organizar seus objetivos para o próximo mês.
20. Reserve um tempo pra descansar de verdade, sem culpa, no frio.
21. Aproveite o clima frio pra estudar algo que te interessa.
22. Use um dia mais parado pra revisar suas prioridades da semana.
23. Aproveite pra escrever uma lista de coisas que você quer fazer quando esquentar.
24. Reserve um tempo pra organizar seus compromissos dos próximos dias.
25. Termine um dia frio escrevendo uma coisa boa que aconteceu, mesmo pequena.
`;

// ===========================================================================
// CALOR — weatherTags:['hot']. Sem esforço físico intenso ao ar livre (seção
// 10/28: evitar recomendação perigosa em calor extremo). ~50.
// ===========================================================================

const HEAT_HEALTH_RAW = `
1. Beba um copo grande de água agora, o calor pede mais hidratação.
2. Prepare uma garrafa de água gelada pra manter por perto o dia todo.
3. Escolha um ambiente mais fresco da casa pra descansar um pouco.
4. Faça uma pausa na sombra ou num ambiente fresco antes de continuar o dia.
5. Prepare uma fruta gelada como lanche num dia quente.
6. Evite esforço físico intenso agora — prefira algo leve e tranquilo.
7. Molhe o rosto ou a nuca com água fresca pra se refrescar.
8. Use uma roupa leve e confortável pra aguentar melhor o calor.
9. Prepare uma bebida gelada e sem açúcar pra se refrescar.
10. Reserve as tarefas mais pesadas pra um horário mais fresco do dia.
11. Faça uma pausa mais longa à sombra se estiver precisando sair.
12. Beba água antes de sentir sede — o calor engana a percepção de sede.
13. Prepare uma salada refrescante pra uma das refeições de hoje.
14. Aproveite um ambiente com ventilação pra descansar um pouco.
15. Evite ficar exposto ao sol forte no horário de pico do calor.
16. Faça alongamentos leves num ambiente fresco em vez de exercício intenso.
17. Prepare gelo ou uma compressa fria se estiver sentindo muito calor.
18. Reduza o ritmo das suas tarefas físicas nas horas mais quentes.
19. Beba água com mais frequência ao longo do dia hoje.
20. Descanse num ambiente fresco por alguns minutos antes de continuar.
21. Prepare um suco natural gelado como alternativa a bebidas açucaradas.
22. Use um leque, ventilador ou ambiente com sombra pra se refrescar.
23. Faça uma pausa pra se hidratar antes de qualquer atividade física leve.
24. Evite alimentos muito pesados numa refeição em dia de calor extremo.
25. Prepare uma bebida gelada pra tomar com calma, sem pressa.
26. Descanse mais um pouco hoje — o calor cansa mais do que parece.
`;

const HEAT_FAMILY_RAW = `
1. Prepare uma bebida gelada pra compartilhar com quem estiver em casa.
2. Aproveite um ambiente fresco de casa pra conversar com a família.
3. Prepare uma fruta gelada pra compartilhar com a família no calor.
4. Escolha uma atividade tranquila dentro de casa pra fazer com a família hoje.
5. Aproveite o calor pra fazer uma pausa mais longa com quem está em casa.
6. Prepare uma salada de frutas gelada pra família num dia quente.
7. Reserve um horário mais fresco do dia pra sair com a família, se for sair.
8. Aproveite pra assistir algo tranquilo em casa com a família no calor.
9. Prepare uma limonada ou suco natural pra compartilhar em casa.
10. Escolha um jogo tranquilo pra jogar em ambiente fresco com a família.
11. Aproveite o calor pra ficar mais tempo dentro de casa com quem você gosta.
12. Prepare um lanche leve e fresco pra compartilhar com a família.
13. Reserve um tempo num ambiente com ventilador ou ar-condicionado pra conversar em família.
14. Aproveite pra contar histórias num canto fresco da casa com a família.
15. Prepare uma sobremesa gelada simples pra fazer com uma criança da casa.
16. Escolha uma atividade leve e tranquila pra fazer com os filhos no calor.
17. Aproveite pra brincar de algo tranquilo dentro de casa com uma criança.
18. Reserve o horário mais fresco do fim de tarde pra um momento em família.
19. Prepare água aromatizada com frutas pra deixar por perto da família.
20. Termine o dia quente com a família num ambiente fresco, conversando com calma.
`;

// ===========================================================================
// TEMPO AGRADÁVEL — weatherTags:['comfortable','outdoor']. ~80.
// ===========================================================================

const PLEASANT_HEALTH_RAW = `
1. Aproveite o clima agradável pra fazer uma caminhada ao ar livre.
2. Faça um alongamento ao ar livre, aproveitando o dia bom.
3. Aproveite pra tomar um pouco de sol de manhã, com moderação.
4. Faça uma caminhada leve num parque ou praça perto de você.
5. Aproveite o dia agradável pra sair pra uma volta curta a pé.
6. Faça uma pausa ao ar livre entre duas tarefas, aproveitando o clima.
7. Aproveite pra respirar ar fresco por alguns minutos lá fora.
8. Faça sua próxima refeição perto de uma janela aberta ou na varanda.
9. Aproveite o clima bom pra fazer um alongamento na varanda ou no quintal.
10. Faça uma caminhada rápida antes ou depois do trabalho, já que o tempo ajuda.
11. Aproveite o dia agradável pra sair um pouco antes do previsto.
12. Faça uma pausa pra observar o céu e o clima por alguns minutos.
13. Aproveite pra caminhar até um lugar que normalmente você vai de carro.
14. Faça um pequeno percurso a pé em vez de usar transporte, se for seguro.
15. Aproveite o clima bom pra tomar seu café da manhã do lado de fora.
16. Faça uma caminhada de 15 minutos aproveitando que o tempo está bom.
17. Aproveite pra alongar o corpo ao ar livre antes de começar o dia.
18. Faça uma pausa lá fora pra sentir o vento e o sol moderado.
19. Aproveite o clima agradável pra caminhar até um lugar que você gosta.
20. Termine o dia com uma caminhada curta aproveitando o tempo bom.
`;

const PLEASANT_FAMILY_RAW = `
1. Aproveite o clima bom pra fazer um piquenique simples com a família.
2. Leve as crianças pra brincar ao ar livre enquanto o tempo ajuda.
3. Aproveite o dia agradável pra fazer uma caminhada com a família.
4. Proponha uma tarde ao ar livre com quem mora com você.
5. Aproveite o clima bom pra visitar uma praça ou parque perto de casa.
6. Leve a família pra andar de bicicleta, se for seguro e possível.
7. Aproveite o tempo bom pra almoçar ou lanchar do lado de fora com a família.
8. Proponha uma pequena aventura ao ar livre com os filhos.
9. Aproveite o clima agradável pra sentar no quintal ou na varanda com a família.
10. Leve alguém da família pra observar a natureza por alguns minutos.
11. Aproveite o dia bom pra brincar ao ar livre com uma criança da casa.
12. Proponha uma caminhada em família até um lugar que todos gostem.
13. Aproveite o clima pra tirar fotos espontâneas da família ao ar livre. 📱
14. Leve a família pra conhecer um lugar novo perto de casa.
15. Aproveite o tempo bom pra fazer um lanche ao ar livre com quem você ama.
16. Proponha um jogo ao ar livre com a família, aproveitando o clima.
17. Aproveite o dia agradável pra visitar um familiar que mora por perto.
18. Leve as crianças pra uma pequena aventura no quintal ou na rua, com segurança.
19. Aproveite o clima bom pra fazer uma roda de conversa ao ar livre em família.
20. Termine o dia com uma caminhada em família, aproveitando o tempo bom.
`;

const PLEASANT_COMMUNITY_RAW = `
1. Aproveite o dia bom pra cumprimentar vizinhos que você encontrar na rua.
2. Aproveite o clima agradável pra ajudar um vizinho com algo do lado de fora.
3. Aproveite o tempo bom pra caminhar até um lugar e conhecer alguém novo.
4. Aproveite o clima pra levar um vizinho idoso pra dar uma volta curta.
5. Aproveite o dia agradável pra visitar um pequeno comércio local. 📱
6. Aproveite pra cumprimentar alguém que você encontra sempre no seu bairro.
7. Aproveite o clima bom pra oferecer companhia a alguém que está sozinho.
8. Aproveite o tempo agradável pra fazer uma gentileza ao ar livre para um desconhecido.
9. Aproveite o dia bom pra conhecer um espaço público perto de casa.
10. Aproveite o clima pra levar algo útil a um vizinho que precise.
11. Aproveite o dia agradável pra caminhar por um bairro que você não conhece bem.
12. Aproveite o clima bom pra recolher um lixo que encontrar no caminho.
13. Aproveite o tempo bom pra sentar num banco de praça e observar ao redor.
14. Aproveite o dia agradável pra conversar com alguém que você encontra sempre e nunca parou pra falar.
15. Aproveite o clima pra visitar uma feira ou mercado local perto de casa.
16. Aproveite o tempo bom pra oferecer ajuda a alguém carregando algo pesado.
17. Aproveite o dia agradável pra levar uma planta ou flor pra alguém.
18. Aproveite o clima bom pra fazer uma caminhada solidária: leve um saco pra recolher lixo do caminho.
19. Aproveite o tempo bom pra conhecer um projeto comunitário perto de você.
20. Termine um dia agradável fazendo uma última gentileza a alguém do seu bairro.
`;

// ===========================================================================
// SOL — weatherTags:['sunny']. Moderação, sem exposição prolongada. ~40.
// ===========================================================================

const SUNNY_HEALTH_RAW = `
1. Aproveite alguns minutos de sol da manhã, com moderação e proteção.
2. Faça uma pausa curta ao sol pela manhã, aproveitando a luz natural.
3. Aproveite o dia de sol pra abrir as janelas e deixar a luz entrar.
4. Faça uma caminhada curta pela manhã aproveitando o sol mais ameno.
5. Aproveite a luz natural do sol pra ajustar seu horário de dormir hoje.
6. Faça uma pausa ao ar livre com proteção solar adequada.
7. Aproveite o sol da manhã pra tomar seu café da manhã perto de uma janela.
8. Faça um alongamento ao sol da manhã, com moderação.
9. Aproveite o dia ensolarado pra secar roupas ou arejar a casa.
10. Faça uma pausa curta lá fora, com proteção, aproveitando o dia de sol.
11. Aproveite a manhã de sol pra acordar um pouco mais cedo e aproveitar a luz.
12. Faça uma caminhada leve num horário de sol mais ameno, com proteção.
13. Aproveite o sol pra arejar os cômodos da casa hoje.
14. Faça uma pausa pra observar o dia ensolarado por alguns minutos.
15. Aproveite a luz do sol pra tirar uma foto bonita de algo simples. 📱
16. Termine a manhã de sol com uma caminhada curta e protegida.
`;

const SUNNY_FAMILY_RAW = `
1. Aproveite o dia de sol pra levar a família pra um passeio curto.
2. Aproveite a luz do dia pra brincar ao ar livre com uma criança, com proteção.
3. Aproveite o sol da manhã pra tomar café da manhã com a família na varanda.
4. Leve a família pra aproveitar um espaço aberto com sombra disponível.
5. Aproveite o dia ensolarado pra tirar fotos em família. 📱
6. Aproveite o sol pra estender roupas ou arejar a casa com a ajuda da família.
7. Leve as crianças pra um passeio curto com protetor solar e água.
8. Aproveite o dia de sol pra sentar num lugar arejado com a família.
9. Aproveite a manhã ensolarada pra fazer um pequeno passeio de bicicleta em família.
10. Aproveite o sol pra fazer uma atividade ao ar livre num horário mais ameno.
11. Aproveite o dia de sol pra visitar um parque com sombra disponível.
12. Leve a família pra uma área verde perto de casa, com proteção adequada.
13. Aproveite o dia ensolarado pra fazer um lanche num espaço aberto e com sombra.
14. Aproveite o sol da manhã pra fazer uma caminhada leve com quem você ama.
15. Termine um dia de sol com a família contando o que mais gostaram de fazer lá fora.
`;

// ===========================================================================
// TEMPESTADE / CHUVA FORTE — weatherTags:['storm','indoor']. Exclusivamente
// atividades internas (seção 13: nunca sugerir atividade externa em condição
// adversa). ~35.
// ===========================================================================

const STORM_HEALTH_RAW = `
1. Aproveite a tempestade pra ficar em casa e descansar de verdade.
2. Prepare algo quente pra tomar enquanto a tempestade passa.
3. Faça um alongamento tranquilo dentro de casa enquanto chove forte.
4. Aproveite pra dormir mais cedo num dia de tempestade.
5. Prepare um ambiente confortável dentro de casa pra relaxar hoje.
6. Faça uma pausa de respiração tranquila ouvindo a chuva forte.
7. Aproveite a tempestade pra reduzir o ritmo do seu dia com calma.
8. Prepare uma refeição quente e reconfortante enquanto a tempestade passa.
9. Aproveite pra desligar as telas por um tempo enquanto chove forte.
10. Faça um automassagem relaxante enquanto espera a tempestade passar.
11. Aproveite a tempestade pra descansar sem culpa hoje.
12. Prepare um chá quente e aproveite um momento tranquilo em casa.
13. Faça uma pausa mais longa do que o normal, já que sair não é seguro agora.
14. Aproveite pra cuidar de você com calma enquanto a tempestade passa.
15. Termine o dia de tempestade com um ritual calmo antes de dormir.
`;

const STORM_FAMILY_RAW = `
1. Aproveite alguns minutos dentro de casa pra organizar uma área que passa despercebida.
2. Reúna a família num ambiente confortável enquanto a tempestade passa.
3. Aproveite pra jogar um jogo de tabuleiro em casa durante a tempestade.
4. Conte histórias em família enquanto esperam a tempestade passar com segurança.
5. Aproveite pra assistir algo tranquilo em família durante a tempestade.
6. Organize uma gaveta ou armário enquanto fica em casa por segurança.
7. Prepare uma atividade calma com as crianças enquanto chove forte lá fora.
8. Aproveite pra conversar com a família sobre os planos para quando o tempo melhorar.
9. Confira se está tudo seguro em casa durante a tempestade.
10. Aproveite o tempo dentro de casa pra fazer algo manual e tranquilo com a família.
11. Prepare uma refeição reconfortante para todos enquanto a tempestade passa.
12. Aproveite pra ensinar uma criança a fazer algo simples dentro de casa.
13. Reserve um momento pra tranquilizar alguém da família que fica ansioso com tempestades.
14. Aproveite pra fazer companhia a alguém da casa enquanto o tempo está ruim.
15. Termine o dia de tempestade com a família em segurança e tranquilidade.
`;

// ===========================================================================
// ESTAÇÕES — seasonTags. ~20 cada, 80 no total.
// ===========================================================================

const SPRING_RAW = `
1. Aproveite a primavera pra abrir as janelas e arejar a casa.
2. Observe uma planta ou flor florescendo perto de você.
3. Aproveite a estação pra começar um pequeno hábito novo.
4. Faça uma pequena limpeza ou organização de renovação em casa.
5. Aproveite o clima da primavera pra fazer uma caminhada ao ar livre.
6. Escreva uma meta pequena pra essa nova estação.
7. Aproveite a primavera pra plantar ou cuidar de uma planta.
8. Observe as mudanças no clima e no ambiente ao seu redor.
9. Aproveite a estação pra retomar um hábito que você tinha abandonado.
10. Faça uma pausa pra notar como a luz do dia está diferente agora.
11. Aproveite a primavera pra renovar algo simples no seu espaço.
12. Doe ou organize roupas que você não usa mais, aproveitando a limpeza de estação.
13. Aproveite o clima ameno pra sair um pouco mais do que o normal.
14. Escreva sobre algo que você quer "florescer" nesse período da sua vida.
15. Aproveite a primavera pra reconectar com um amigo depois do inverno.
16. Faça uma caminhada notando as cores e cheiros típicos da estação.
17. Aproveite pra trocar a roupa de cama por algo mais leve.
18. Aproveite a estação pra recomeçar algo que você tinha pausado.
19. Observe um inseto, pássaro ou planta típica dessa época do ano.
20. Termine o dia reconhecendo uma coisa que está renovada na sua vida.
`;

const SUMMER_RAW = `
1. Beba mais água ao longo do dia, típico do calor do verão.
2. Aproveite o verão pra fazer uma atividade leve ao ar livre pela manhã.
3. Use roupas leves e frescas pra aproveitar melhor o calor do verão.
4. Aproveite as tardes mais longas do verão pra uma caminhada após o trabalho.
5. Prepare uma fruta gelada típica do verão como lanche.
6. Aproveite o verão pra passar mais tempo com a família ao ar livre, com proteção.
7. Reserve um tempo pra descansar durante as horas mais quentes do dia.
8. Aproveite o verão pra reduzir o consumo de telas e ficar mais ao ar livre.
9. Prepare uma salada refrescante típica do verão.
10. Aproveite as noites de verão pra ficar um pouco mais ao ar livre com a família.
11. Use protetor solar antes de sair, aproveitando o verão com segurança.
12. Aproveite o verão pra experimentar uma fruta da estação que você não costuma comer.
13. Reserve um momento pra descansar à sombra durante o verão.
14. Aproveite as férias ou dias mais livres típicos do verão pra descansar de verdade.
15. Aproveite o verão pra fazer um piquenique leve com quem você gosta.
16. Beba água antes de qualquer atividade ao ar livre no verão.
17. Aproveite o verão pra tirar fotos de um pôr do sol. 📱
18. Reserve um tempo pra simplesmente aproveitar o dia mais longo do verão.
19. Aproveite o verão pra experimentar uma atividade nova ao ar livre, com moderação.
20. Termine o dia de verão agradecendo por um momento leve que você teve.
`;

const AUTUMN_RAW = `
1. Aproveite o outono pra refletir sobre o que você quer deixar pra trás.
2. Observe as folhas ou mudanças de cor típicas do outono, se houver perto de você.
3. Aproveite o clima mais ameno do outono pra uma caminhada tranquila.
4. Escreva sobre uma coisa que você colheu (aprendeu ou conquistou) nos últimos meses.
5. Aproveite o outono pra organizar o guarda-roupa pra estação mais fria.
6. Reserve um tempo pra uma leitura mais longa, aproveitando as noites do outono.
7. Aproveite o clima do outono pra preparar uma bebida quente com calma.
8. Escreva sobre algo que está em transição na sua vida agora.
9. Aproveite o outono pra revisar suas metas do ano até aqui.
10. Reserve um momento pra agradecer por algo que você colheu esse ano.
11. Aproveite o clima mais fresco do outono pra dormir um pouco mais cedo.
12. Aproveite o outono pra reorganizar sua rotina antes do frio chegar.
13. Reserve um tempo pra uma reflexão tranquila sobre os últimos meses.
14. Aproveite o outono pra se reconectar com alguém antes do fim do ano chegar.
15. Aproveite o clima do outono pra uma caminhada mais contemplativa.
16. Escreva sobre uma mudança que você percebeu em você mesmo recentemente.
17. Aproveite o outono pra preparar a casa para os meses mais frios.
18. Reserve um tempo pra terminar algo que você começou no meio do ano.
19. Aproveite o clima do outono pra uma tarde de leitura tranquila.
20. Termine o dia de outono reconhecendo algo que amadureceu em você esse ano.
`;

const WINTER_RAW = `
1. Aproveite o inverno pra ficar mais tempo em casa com quem você ama.
2. Prepare uma bebida quente e aproveite o clima mais frio com calma.
3. Aproveite as noites mais longas do inverno pra dormir um pouco mais.
4. Reserve um tempo pra uma reflexão tranquila num dia frio de inverno.
5. Aproveite o inverno pra reorganizar o guarda-roupa mais quente.
6. Prepare uma refeição reconfortante típica do inverno.
7. Aproveite o clima frio pra uma tarde de jogos em família.
8. Reserve um tempo pra escrever sobre o que você aprendeu esse ano.
9. Aproveite o inverno pra ler mais, já que se sai menos de casa.
10. Prepare um chá ou chocolate quente pra compartilhar com alguém.
11. Aproveite as noites de inverno pra assistir algo tranquilo em família.
12. Reserve um tempo pra planejar metas pro início do próximo ciclo.
13. Aproveite o inverno pra cuidar mais da sua pele e do seu conforto.
14. Aproveite o clima frio pra uma conversa longa e tranquila em casa.
15. Reserve um momento pra agradecer pelo aconchego que você tem hoje.
16. Aproveite o inverno pra reorganizar a casa pra ficar mais aconchegante.
17. Aproveite as noites mais longas pra um ritual de sono mais cuidadoso.
18. Reserve um tempo pra reconectar com alguém que você não vê há um tempo.
19. Aproveite o clima frio pra uma tarde de conforto, sem culpa, em casa.
20. Termine um dia de inverno reconhecendo o aconchego de estar em casa.
`;

// ===========================================================================
// INDOOR — weatherTags:['indoor']. ~60.
// ===========================================================================

const INDOOR_LEARNING_RAW = `
1. Aproveite um momento dentro de casa pra aprender algo novo online.
2. Leia algumas páginas de um livro num canto tranquilo de casa.
3. Assista a uma aula ou vídeo curto e educativo dentro de casa.
4. Aproveite pra organizar seus estudos ou leituras pendentes em casa.
5. Ouça um podcast educativo enquanto organiza algo dentro de casa.
6. Aproveite pra aprender uma palavra nova num momento tranquilo em casa.
7. Reserve um tempo dentro de casa pra pesquisar algo que te interessa.
8. Aproveite pra testar uma receita nova dentro de casa.
9. Aproveite um momento em casa pra aprender uma habilidade manual simples.
10. Reserve um tempo dentro de casa pra organizar suas anotações ou ideias.
11. Aproveite pra assistir um documentário curto dentro de casa.
12. Aproveite um momento tranquilo em casa pra escrever sobre algo que aprendeu.
13. Reserve um tempo dentro de casa pra revisar um projeto pessoal.
14. Aproveite pra aprender uma nova função de um aplicativo que você usa.
15. Aproveite um momento em casa pra organizar seus livros ou materiais de estudo.
16. Reserve um tempo dentro de casa pra praticar algo que você está aprendendo.
17. Aproveite pra pesquisar uma dúvida antiga num momento livre em casa.
18. Aproveite um momento tranquilo pra ensinar algo simples a alguém em casa.
19. Reserve um tempo dentro de casa pra planejar o que quer aprender esse mês.
20. Aproveite pra terminar um curso ou material que você começou e pausou.
21. Aproveite um dia em casa pra reorganizar seu ambiente de estudo.
22. Reserve um tempo pra aprender algo com um vídeo curto durante uma pausa.
23. Aproveite pra escrever um resumo de algo interessante que você leu.
24. Aproveite um momento em casa pra descobrir uma curiosidade nova.
25. Reserve um tempo dentro de casa pra organizar ideias para um projeto futuro.
26. Aproveite pra aprender uma técnica simples de organização pessoal.
27. Aproveite um momento tranquilo pra revisar algo que você aprendeu essa semana.
28. Reserve um tempo dentro de casa pra explorar um assunto novo por curiosidade.
29. Aproveite pra praticar uma habilidade que você quer desenvolver, mesmo por poucos minutos.
30. Termine o dia dentro de casa anotando algo novo que você descobriu hoje.
`;

const INDOOR_DEV_RAW = `
1. Aproveite um momento dentro de casa pra organizar seus pensamentos por escrito.
2. Reserve um tempo em casa pra uma pausa de silêncio, sem tela.
3. Aproveite pra organizar um espaço da casa que está bagunçado.
4. Reserve um tempo dentro de casa pra planejar a semana com calma.
5. Aproveite um momento em casa pra fazer um alongamento tranquilo.
6. Reserve um tempo pra terminar uma tarefa pendente dentro de casa.
7. Aproveite pra organizar seus documentos ou papéis importantes em casa.
8. Reserve um momento em casa pra refletir sobre uma decisão que está adiando.
9. Aproveite um dia dentro de casa pra descansar de verdade, sem culpa.
10. Reserve um tempo pra escrever três coisas que você é grato hoje.
11. Aproveite um momento em casa pra organizar sua área de trabalho.
12. Reserve um tempo dentro de casa pra uma meditação ou respiração guiada.
13. Aproveite pra reorganizar seu quarto de um jeito que te deixe mais confortável.
14. Reserve um momento em casa pra revisar suas metas pessoais.
15. Aproveite um dia dentro de casa pra cuidar de uma tarefa financeira simples.
16. Reserve um tempo pra organizar seu guarda-roupa e separar o que não usa mais.
17. Aproveite um momento em casa pra escrever sobre como você está se sentindo.
18. Reserve um tempo dentro de casa pra planejar um objetivo pequeno pra semana.
19. Aproveite pra organizar sua lista de tarefas e priorizar o que importa.
20. Reserve um momento em casa pra descansar os olhos das telas.
21. Aproveite um dia dentro de casa pra reorganizar seus arquivos digitais.
22. Reserve um tempo pra uma pausa de verdade entre duas tarefas em casa.
23. Aproveite um momento em casa pra revisar como está indo o seu mês.
24. Reserve um tempo dentro de casa pra pensar num próximo passo pra um objetivo seu.
25. Aproveite pra organizar sua rotina de sono, já que vai passar a noite em casa.
26. Reserve um momento em casa pra reconhecer uma pequena vitória sua recente.
27. Aproveite um dia dentro de casa pra cuidar de algo que estava pendente há tempo.
28. Reserve um tempo pra escrever uma reflexão sobre a semana que está passando.
29. Aproveite um momento em casa pra simplesmente descansar sem culpa.
30. Termine um dia dentro de casa reconhecendo algo que você organizou ou resolveu.
`;

// ===========================================================================
// OUTDOOR — weatherTags:['outdoor']. Só usado quando o contexto permitir (bom
// tempo, dia livre). ~60.
// ===========================================================================

const OUTDOOR_HEALTH_RAW = `
1. Faça uma caminhada ao ar livre por pelo menos 15 minutos.
2. Aproveite o dia livre pra fazer uma atividade física leve ao ar livre.
3. Faça um alongamento completo num espaço aberto.
4. Aproveite pra andar até um lugar em vez de usar transporte, se for seguro.
5. Faça uma caminhada num parque ou praça perto de você.
6. Aproveite o tempo livre pra sair pra tomar ar fresco.
7. Faça uma pausa ao ar livre entre duas tarefas do seu dia.
8. Aproveite pra andar de bicicleta, se você tiver e for seguro.
9. Faça uma caminhada rápida antes de começar o expediente, se for possível.
10. Aproveite um momento livre pra sair e observar a natureza ao redor.
11. Faça uma trilha curta e leve, se houver uma opção segura perto de você.
12. Aproveite pra caminhar escutando algo que você gosta, ao ar livre.
13. Faça uma sessão de alongamento na varanda, no quintal ou numa praça.
14. Aproveite o ar livre pra fazer uma pausa de respiração consciente.
15. Faça um pequeno percurso a pé como parte da sua rotina hoje.
16. Aproveite pra caminhar até um lugar que você nunca foi a pé.
17. Faça uma caminhada leve depois de uma refeição, se for seguro.
18. Aproveite o tempo livre pra sair e espairecer por alguns minutos.
19. Faça um momento de exercício leve ao ar livre, dentro do seu ritmo.
20. Termine o dia com uma caminhada curta ao ar livre.
`;

const OUTDOOR_COMMUNITY_RAW = `
1. Aproveite uma saída ao ar livre pra cumprimentar um vizinho.
2. Aproveite o tempo livre pra visitar um espaço público perto de casa.
3. Aproveite uma caminhada pra recolher um lixo que encontrar no caminho.
4. Aproveite pra visitar um pequeno comércio local durante uma saída ao ar livre. 📱
5. Aproveite uma saída pra conhecer um canto novo do seu bairro.
6. Aproveite o ar livre pra oferecer ajuda a alguém que precise no caminho.
7. Aproveite uma caminhada pra observar e valorizar o espaço público ao seu redor.
8. Aproveite o tempo livre pra levar alguém que você gosta pra um passeio simples.
9. Aproveite uma saída ao ar livre pra visitar um familiar que mora por perto.
10. Aproveite pra conhecer uma praça ou parque que você nunca visitou.
11. Aproveite uma caminhada pra notar e agradecer pelo espaço onde você vive.
12. Aproveite o ar livre pra convidar um amigo pra uma volta curta.
13. Aproveite uma saída pra fazer uma gentileza simples com alguém que encontrar.
14. Aproveite o tempo livre pra observar a vizinhança com mais atenção.
15. Aproveite uma caminhada pra levar as crianças pra brincar num espaço público.
16. Aproveite o ar livre pra conversar com alguém que você encontra sempre e nunca parou.
17. Aproveite uma saída pra visitar um projeto ou espaço comunitário perto de você.
18. Aproveite o tempo livre pra dar uma volta com um vizinho ou amigo.
19. Aproveite uma caminhada pra notar algo bonito no seu bairro que passa despercebido.
20. Termine uma saída ao ar livre reconhecendo uma coisa boa do seu entorno.
`;

// ===========================================================================
// DATAS COMEMORATIVAS (expansão) — contentLevel:'event_specific', eventTags
// batendo com os tags de cada Holiday em src/data/holidays/brazil.ts. Texto
// escrito de forma phase-agnostic (o "antes/hoje/depois" já é resolvido pelo
// motor via buildReasons — ver seção 18); aqui a variedade de ideias é o que
// evita "só ter ação pro dia do evento" (seção 18 do pedido). Pares
// específico/genérico onde a data envolve uma relação (seção 13/20).
// ===========================================================================

const NEW_YEAR_RAW = `
1. Escreva uma palavra que você quer que guie o seu próximo ano.
2. Escreva três coisas boas que aconteceram nesse ano que está terminando.
3. Pense em uma coisa que você quer deixar para trás nesse novo ciclo.
4. Escreva uma meta pequena e realista para os próximos meses.
5. Agradeça por uma conquista desse ano, mesmo que pequena.
6. Pense em uma pessoa que fez diferença na sua vida nesse ano e agradeça a ela.
7. Escreva uma coisa que você aprendeu esse ano sobre você mesmo.
8. Reserve um tempo pra revisar o que funcionou bem esse ano.
9. Escolha uma intenção simples pra guiar seu próximo ciclo.
10. Pense em uma dificuldade desse ano que te ensinou algo importante.
11. Escreva uma carta para o seu "eu" do ano que vem.
12. Reconheça um progresso que você fez esse ano, mesmo pequeno.
13. Pense em uma coisa que você quer fazer diferente daqui pra frente.
14. Agradeça por algo simples que você teve esse ano e talvez nunca tenha reconhecido.
15. Escolha uma pequena atitude que represente como você quer começar esse novo ciclo.
`;

const WOMENS_DAY_RAW = `
1. Reconheça e agradeça a uma mulher que foi importante na sua formação.
2. Envie uma mensagem de admiração para uma mulher que você respeita.
3. Elogie sinceramente uma conquista de uma mulher importante na sua vida.
4. Pergunte a uma mulher importante pra você como ela está se sentindo hoje.
5. Reconheça publicamente o trabalho de uma mulher que você admira. 📱
6. Pense em uma mulher que abriu caminho pra você e agradeça a ela.
7. Ofereça apoio a uma mulher que esteja enfrentando um momento difícil.
8. Compartilhe uma conquista de uma mulher importante pra você. 📱
9. Diga a uma mulher da sua vida uma qualidade que você admira nela.
10. Reconheça, com alguém importante, o esforço das mulheres da sua família.
`;

const CARNIVAL_RAW = `
1. Escolha uma música alegre e dance por alguns minutos, só por diversão.
2. Faça algo divertido hoje sem transformar isso em produtividade.
3. Reserve um tempo pra brincar, rir e não levar tudo tão a sério.
4. Convide alguém para curtir um momento leve e descontraído com você.
5. Escute uma playlist animada enquanto faz alguma tarefa do dia.
6. Permita-se um momento de leveza e diversão, mesmo que simples.
7. Faça algo criativo e divertido que você não faz há tempos.
8. Aproveite o clima de festa pra se conectar com pessoas queridas.
`;

const EASTER_RAW = `
1. Reúna quem mora com você para uma refeição especial, mesmo simples.
2. Prepare algo diferente pra compartilhar com a família nesses dias.
3. Reserve um tempo pra refletir sobre um recomeço que você precisa fazer.
4. Pense em algo que você quer "renascer" na sua vida agora.
5. Agradeça por um recomeço ou uma segunda chance que você teve.
6. Reconecte-se com alguém da família nesses dias de pausa.
7. Reserve um momento de reflexão tranquila sobre esperança e recomeços.
8. Prepare uma sobremesa simples pra compartilhar com quem está por perto.
9. Pense em uma pessoa que merece uma segunda chance da sua parte.
10. Reserve um tempo pra agradecer pelas pessoas que estão ao seu redor nesses dias.
11. Aproveite esses dias de pausa pra descansar de verdade com a família.
12. Escreva sobre o que esperança significa pra você nesse momento da vida.
`;

const MOTHERS_DAY_SPECIFIC_RAW = `
1. Ligue para {pessoa} e pergunte como ela está de verdade nesses dias.
2. Escreva pra {pessoa} um motivo específico do porquê você é grato(a) a ela.
3. Prepare ou envie algo simples que {pessoa} goste, mesmo sem grande ocasião.
4. Conte a {pessoa} uma lembrança feliz que você tem dela cuidando de você.
5. Pergunte a {pessoa} uma lembrança boa que ela tem de você quando criança.
6. Passe um tempo com {pessoa} hoje, mesmo que curto, só pra estar presente.
7. Envie uma mensagem contando a {pessoa} por que você tem orgulho de ser filho(a) dela.
8. Reserve um tempo ao telefone com {pessoa}, sem pressa, nesses dias.
9. Pergunte a {pessoa} como foi a experiência dela de cuidar de você.
10. Diga a {pessoa} uma coisa que você nunca teve a chance de agradecer antes.
`;

const MOTHERS_DAY_GENERIC_RAW = `
1. Pense em alguém que teve um papel materno na sua vida e agradeça a ela.
2. Envie uma mensagem carinhosa para uma mulher que cuidou de você em algum momento.
3. Reconheça o esforço de alguém que teve um papel importante na sua criação.
4. Agradeça a alguém que exerceu cuidado maternal com você, mesmo sem ser sua mãe biológica.
5. Pense em uma qualidade de cuidado que você quer levar adiante na sua vida.
6. Envie uma mensagem de carinho a alguém que você considera uma figura materna.
7. Reserve um tempo pra pensar em como o cuidado de alguém moldou quem você é.
8. Agradeça a alguém que sempre esteve presente cuidando de você.
9. Reconheça, mesmo à distância, alguém que exerceu um papel de cuidado importante.
10. Pense numa forma simples de honrar quem cuidou de você ao longo da vida.
`;

const VALENTINES_SPECIFIC_RAW = `
1. Planeje um momento simples e especial pra passar com {pessoa}.
2. Diga a {pessoa} um motivo específico pelo qual você a escolhe todos os dias.
3. Prepare algo que {pessoa} goste, sem esperar uma data maior.
4. Envie pra {pessoa} uma mensagem que descreva o que essa data significa pra vocês.
5. Relembre com {pessoa} um momento marcante do começo da relação de vocês.
6. Ofereça 20 minutos de atenção total a {pessoa}, sem celular por perto.
7. Escreva pra {pessoa} três coisas que você ama nela.
8. Pergunte a {pessoa} como ela gostaria de comemorar esse dia com você.
9. Prepare uma surpresa pequena e simples pra {pessoa}.
10. Diga a {pessoa} algo que você nunca teve coragem de dizer.
`;

const VALENTINES_GENERIC_RAW = `
1. Planeje um momento simples e especial com alguém importante pra você.
2. Diga a alguém um motivo específico pelo qual ela é especial na sua vida.
3. Prepare algo que alguém importante goste, sem esperar uma data maior.
4. Envie pra alguém importante uma mensagem que descreva o que essa data significa pra vocês.
5. Relembre com alguém um momento marcante do começo da relação de vocês.
6. Ofereça 20 minutos de atenção total a alguém, sem celular por perto.
7. Escreva sobre três coisas que você ama em alguém importante e diga a ela.
8. Pergunte a alguém importante como ela gostaria de passar esse dia com você.
9. Prepare uma surpresa pequena e simples pra alguém que você ama.
10. Diga a alguém importante algo que você nunca teve coragem de dizer.
`;

const FRIENDS_DAY_SPECIFIC_RAW = `
1. Ligue para {pessoa} só pra dizer que a amizade dela importa pra você.
2. Relembre com {pessoa} um momento engraçado que vocês viveram juntos.
3. Envie uma mensagem contando a {pessoa} um motivo pelo qual você é grato por ela.
4. Convide {pessoa} para um encontro simples nesses dias.
5. Diga a {pessoa} uma qualidade dela que você sempre admirou.
6. Reconecte-se com {pessoa}, mesmo que tenham perdido contato por um tempo.
`;

const FRIENDS_DAY_GENERIC_RAW = `
1. Ligue para um amigo só pra dizer que a amizade dele importa pra você.
2. Relembre com um amigo um momento engraçado que vocês viveram juntos.
3. Envie uma mensagem contando a um amigo um motivo pelo qual você é grato por ele.
4. Convide um amigo para um encontro simples nesses dias.
`;

const FATHERS_DAY_SPECIFIC_RAW = `
1. Ligue para {pessoa} e pergunte como ele está de verdade nesses dias.
2. Escreva pra {pessoa} um motivo específico do porquê você é grato(a) a ele.
3. Pergunte a {pessoa} uma lembrança da juventude dele.
4. Diga a {pessoa} uma coisa que você aprendeu com ele.
5. Passe um tempo com {pessoa} hoje, mesmo que curto, só pra estar presente.
6. Envie uma mensagem contando a {pessoa} por que você tem orgulho de ser filho(a) dele.
7. Reserve um tempo ao telefone com {pessoa}, sem pressa, nesses dias.
8. Pergunte a {pessoa} como foi a experiência dele de cuidar de você.
9. Diga a {pessoa} uma coisa que você nunca teve a chance de agradecer antes.
10. Pergunte a {pessoa} um conselho sobre algo que você está vivendo agora.
`;

const FATHERS_DAY_GENERIC_RAW = `
1. Pense em alguém que teve um papel paterno na sua vida e agradeça a ela.
2. Envie uma mensagem carinhosa para alguém que cuidou de você em algum momento.
3. Reconheça o esforço de alguém que teve um papel importante na sua criação.
4. Agradeça a alguém que exerceu cuidado paternal com você, mesmo sem ser seu pai biológico.
5. Reserve um tempo pra pensar em como o cuidado de alguém moldou quem você é.
6. Envie uma mensagem de carinho a alguém que você considera uma figura paterna.
7. Agradeça a alguém que sempre esteve presente cuidando de você.
8. Reconheça, mesmo à distância, alguém que exerceu um papel de cuidado importante.
9. Pense numa forma simples de honrar quem cuidou de você ao longo da vida.
10. Escreva sobre uma lição de vida que alguém importante te ensinou.
`;

const MENTAL_HEALTH_RAW = `
1. Reserve cinco minutos pra checar como você realmente está se sentindo hoje.
2. Escreva sobre uma preocupação que está pesando e uma ação possível sobre ela.
3. Permita-se descansar sem culpa, mesmo que só por hoje.
4. Pergunte a alguém importante como a saúde mental dela está esses dias.
5. Reconheça um progresso emocional que você fez recentemente, mesmo pequeno.
6. Pratique cinco minutos de respiração consciente, sem pressa.
7. Escreva sobre um limite que você precisa colocar pra se cuidar melhor.
8. Pergunte a alguém se ela está precisando de apoio ultimamente.
9. Perdoe a si mesmo por uma pequena falha recente.
10. Reserve um tempo pra fazer algo que só existe pra te trazer prazer, sem culpa.
`;

const CHILDRENS_DAY_SPECIFIC_RAW = `
1. Dedique um tempo maior que o normal pra brincar com {pessoa} hoje.
2. Pergunte a {pessoa} qual é o sonho dela agora e leve a sério.
3. Deixe {pessoa} escolher toda a atividade de hoje, do início ao fim.
4. Prepare uma pequena surpresa simples pra {pessoa}.
5. Pergunte a {pessoa} o que a faria se sentir mais especial hoje.
6. Reserve um tempo maior de atenção total a {pessoa}, sem interrupções.
7. Diga a {pessoa} o quanto ela é importante pra você.
8. Faça hoje uma atividade que {pessoa} sempre pede e você costuma adiar.
`;

const CHILDRENS_DAY_GENERIC_RAW = `
1. Dedique um tempo maior que o normal pra alguém jovem importante pra você.
2. Pergunte a alguém jovem qual é o sonho dela agora e leve a sério.
3. Deixe alguém escolher toda a atividade de hoje, do início ao fim.
4. Prepare uma pequena surpresa simples pra alguém que você ama.
5. Pergunte a alguém o que a faria se sentir mais especial hoje.
6. Reserve um tempo maior de atenção total a alguém, sem interrupções.
7. Diga a alguém o quanto ela é importante pra você.
`;

const CHRISTMAS_RAW = `
1. Reúna quem mora com você para um momento especial, mesmo que simples.
2. Escreva uma mensagem de gratidão para as pessoas mais importantes da sua vida.
3. Reserve um tempo pra refletir sobre o que esse ano te ensinou.
4. Prepare algo especial pra compartilhar com quem está por perto nesses dias.
5. Ligue para um familiar distante que você não vê há um tempo.
6. Agradeça por três coisas boas que você viveu esse ano.
7. Faça uma pequena gentileza para alguém que está sozinho nesses dias.
8. Reconecte-se com alguém importante antes que o ano termine.
9. Escreva uma carta de gratidão para alguém que fez diferença na sua vida esse ano.
10. Prepare um presente simples e afetivo pra alguém, sem precisar gastar muito.
11. Reserve um tempo pra celebrar as pequenas conquistas do ano com quem você ama.
12. Compartilhe uma boa lembrança do ano com a família. 📱
13. Doe algo que você não usa mais para quem precisa nesses dias.
14. Reserve um momento de silêncio pra agradecer por tudo que você tem.
15. Convide alguém que passaria essa época sozinho pra estar com você, se possível.
16. Escreva sobre o que você quer levar desse ano pro próximo.
17. Reconheça o esforço de quem cuidou de você esse ano.
18. Prepare uma refeição especial com a ajuda de quem estiver em casa.
19. Reserve um tempo pra pensar em como você quer terminar esse ano em paz.
20. Termine o dia agradecendo pela sua família, do jeito que ela for.
`;

// ===========================================================================
// Geração
// ===========================================================================

const RAIN_TAGS = { weatherTags: ['rain', 'indoor'] };
const COLD_TAGS = { weatherTags: ['cold', 'indoor'] };
const HEAT_TAGS = { weatherTags: ['hot'] };
const PLEASANT_TAGS = { weatherTags: ['comfortable', 'outdoor'] };
const SUNNY_TAGS = { weatherTags: ['sunny'] };
// Challenge.weatherTags não tem um valor 'storm' dedicado — 'rain' já cobre tempestade
// via NormalizedWeather.isRaining (que inclui rain/heavy_rain/storm, ver weatherModel.ts).
const STORM_TAGS = { weatherTags: ['rain', 'indoor'] };
const INDOOR_TAGS = { weatherTags: ['indoor'] };
const OUTDOOR_TAGS = { weatherTags: ['outdoor'] };

const CHILDREN_RELATIONSHIPS = { relationships: ['filho', 'neto'] };
const PARTNER_RELATIONSHIPS = { relationships: ['conjuge', 'companheiro', 'namorado', 'noivo'] };
const PARENTS_RELATIONSHIPS = { relationships: ['pai', 'mae'] };

function eventOpts(eventTags, extra) {
  return { eventTags, contentLevel: 'event_specific', ...(extra || {}) };
}

const FILES = [
  {
    file: 'familyExpansion.ts',
    varName: 'familyExpansionChallenges',
    blocks: [{ raw: FAMILY_EXPANSION_RAW, categoria: 'familia_presenca', prefix: 'famx', opts: {} }],
  },
  {
    file: 'childrenChallenges.ts',
    varName: 'childrenChallenges',
    blocks: [
      { raw: CHILDREN_SPECIFIC_RAW, categoria: 'familia_presenca', prefix: 'fil', opts: { ...CHILDREN_RELATIONSHIPS, requiresPresence: true } },
      { raw: CHILDREN_GENERIC_RAW, categoria: 'familia_presenca', prefix: 'filg', opts: {} },
    ],
  },
  {
    file: 'partnerChallenges.ts',
    varName: 'partnerChallenges',
    blocks: [
      { raw: PARTNER_SPECIFIC_RAW, categoria: 'relacionamentos', prefix: 'par', opts: { ...PARTNER_RELATIONSHIPS } },
      { raw: PARTNER_GENERIC_RAW, categoria: 'relacionamentos', prefix: 'parg', opts: {} },
    ],
  },
  {
    file: 'parentsChallenges.ts',
    varName: 'parentsChallenges',
    blocks: [
      { raw: PARENTS_SPECIFIC_RAW, categoria: 'relacionamentos', prefix: 'pai', opts: { ...PARENTS_RELATIONSHIPS } },
      { raw: PARENTS_GENERIC_RAW, categoria: 'relacionamentos', prefix: 'paig', opts: {} },
    ],
  },
  {
    file: 'friendsChallenges.ts',
    varName: 'friendsChallenges',
    blocks: [{ raw: FRIENDS_RAW, categoria: 'relacionamentos', prefix: 'ami', opts: {} }],
  },
  {
    file: 'rainChallenges.ts',
    varName: 'rainChallenges',
    blocks: [
      { raw: RAIN_HEALTH_RAW, categoria: 'saude_energia', prefix: 'chu', opts: RAIN_TAGS },
      { raw: RAIN_FAMILY_RAW, categoria: 'familia_presenca', prefix: 'chuf', opts: RAIN_TAGS },
    ],
  },
  {
    file: 'coldChallenges.ts',
    varName: 'coldChallenges',
    blocks: [
      { raw: COLD_HEALTH_RAW, categoria: 'saude_energia', prefix: 'fri', opts: COLD_TAGS },
      { raw: COLD_DEV_RAW, categoria: 'desenvolvimento_pessoal', prefix: 'frid', opts: COLD_TAGS },
    ],
  },
  {
    file: 'hotChallenges.ts',
    varName: 'hotChallenges',
    blocks: [
      { raw: HEAT_HEALTH_RAW, categoria: 'saude_energia', prefix: 'cal', opts: HEAT_TAGS },
      { raw: HEAT_FAMILY_RAW, categoria: 'familia_presenca', prefix: 'calf', opts: HEAT_TAGS },
    ],
  },
  {
    file: 'pleasantWeatherChallenges.ts',
    varName: 'pleasantWeatherChallenges',
    blocks: [
      { raw: PLEASANT_HEALTH_RAW, categoria: 'saude_energia', prefix: 'agr', opts: PLEASANT_TAGS },
      { raw: PLEASANT_FAMILY_RAW, categoria: 'familia_presenca', prefix: 'agrf', opts: PLEASANT_TAGS },
      { raw: PLEASANT_COMMUNITY_RAW, categoria: 'bondade_comunidade', prefix: 'agrc', opts: PLEASANT_TAGS },
    ],
  },
  {
    file: 'sunnyChallenges.ts',
    varName: 'sunnyChallenges',
    blocks: [
      { raw: SUNNY_HEALTH_RAW, categoria: 'saude_energia', prefix: 'sol', opts: SUNNY_TAGS },
      { raw: SUNNY_FAMILY_RAW, categoria: 'familia_presenca', prefix: 'solf', opts: SUNNY_TAGS },
    ],
  },
  {
    file: 'stormChallenges.ts',
    varName: 'stormChallenges',
    blocks: [
      { raw: STORM_HEALTH_RAW, categoria: 'saude_energia', prefix: 'tem', opts: STORM_TAGS },
      { raw: STORM_FAMILY_RAW, categoria: 'familia_presenca', prefix: 'temf', opts: STORM_TAGS },
    ],
  },
  {
    file: 'seasonChallenges.ts',
    varName: 'seasonChallenges',
    blocks: [
      { raw: SPRING_RAW, categoria: 'saude_energia', prefix: 'pri', opts: { seasonTags: ['spring'] } },
      { raw: SUMMER_RAW, categoria: 'saude_energia', prefix: 'ver', opts: { seasonTags: ['summer'] } },
      { raw: AUTUMN_RAW, categoria: 'desenvolvimento_pessoal', prefix: 'out', opts: { seasonTags: ['autumn'] } },
      { raw: WINTER_RAW, categoria: 'desenvolvimento_pessoal', prefix: 'inv', opts: { seasonTags: ['winter'] } },
    ],
  },
  {
    file: 'indoorChallenges.ts',
    varName: 'indoorChallenges',
    blocks: [
      { raw: INDOOR_LEARNING_RAW, categoria: 'aprendizado_curiosidade', prefix: 'ind', opts: INDOOR_TAGS },
      { raw: INDOOR_DEV_RAW, categoria: 'desenvolvimento_pessoal', prefix: 'indd', opts: INDOOR_TAGS },
    ],
  },
  {
    file: 'outdoorChallenges.ts',
    varName: 'outdoorChallenges',
    blocks: [
      { raw: OUTDOOR_HEALTH_RAW, categoria: 'saude_energia', prefix: 'outd', opts: OUTDOOR_TAGS },
      { raw: OUTDOOR_COMMUNITY_RAW, categoria: 'bondade_comunidade', prefix: 'outdc', opts: OUTDOOR_TAGS },
    ],
  },
  {
    file: 'holidayExpansion.ts',
    varName: 'holidayExpansionChallenges',
    // Cada bloco usa SÓ o tag exclusivo do próprio feriado (ver comentário em
    // src/data/holidays/brazil.ts) — não os tags genéricos compartilhados
    // (family/gratitude/relationship/celebration/reflection), porque vários feriados
    // dividem esses tags e o filtro é "some tag overlap": usar só os genéricos fazia
    // conteúdo de um feriado vazar pra outro (bug real encontrado testando Cenário C).
    blocks: [
      { raw: NEW_YEAR_RAW, categoria: 'desenvolvimento_pessoal', prefix: 'holano', opts: eventOpts(['ano_novo']) },
      { raw: WOMENS_DAY_RAW, categoria: 'relacionamentos', prefix: 'holmul', opts: eventOpts(['dia_mulher']) },
      { raw: CARNIVAL_RAW, categoria: 'desenvolvimento_pessoal', prefix: 'holcarn', opts: eventOpts(['carnaval']) },
      { raw: EASTER_RAW, categoria: 'familia_presenca', prefix: 'holpas', opts: eventOpts(['pascoa']) },
      { raw: MOTHERS_DAY_SPECIFIC_RAW, categoria: 'familia_presenca', prefix: 'holmaes', opts: eventOpts(['maternal'], { relationships: ['mae'] }) },
      { raw: MOTHERS_DAY_GENERIC_RAW, categoria: 'relacionamentos', prefix: 'holmaesg', opts: eventOpts(['maternal']) },
      { raw: VALENTINES_SPECIFIC_RAW, categoria: 'relacionamentos', prefix: 'holnam', opts: eventOpts(['namorados'], PARTNER_RELATIONSHIPS) },
      { raw: VALENTINES_GENERIC_RAW, categoria: 'relacionamentos', prefix: 'holnamg', opts: eventOpts(['namorados']) },
      { raw: FRIENDS_DAY_SPECIFIC_RAW, categoria: 'relacionamentos', prefix: 'holami', opts: eventOpts(['dia_amigo'], { relationships: ['amigo'] }) },
      { raw: FRIENDS_DAY_GENERIC_RAW, categoria: 'relacionamentos', prefix: 'holamig', opts: eventOpts(['dia_amigo']) },
      { raw: FATHERS_DAY_SPECIFIC_RAW, categoria: 'familia_presenca', prefix: 'holpai', opts: eventOpts(['paternal'], { relationships: ['pai'] }) },
      { raw: FATHERS_DAY_GENERIC_RAW, categoria: 'relacionamentos', prefix: 'holpaig', opts: eventOpts(['paternal']) },
      { raw: MENTAL_HEALTH_RAW, categoria: 'desenvolvimento_pessoal', prefix: 'holsm', opts: eventOpts(['saude_mental']) },
      { raw: CHILDRENS_DAY_SPECIFIC_RAW, categoria: 'familia_presenca', prefix: 'holcrian', opts: eventOpts(['dia_criancas'], CHILDREN_RELATIONSHIPS) },
      { raw: CHILDRENS_DAY_GENERIC_RAW, categoria: 'familia_presenca', prefix: 'holcriang', opts: eventOpts(['dia_criancas']) },
      { raw: CHRISTMAS_RAW, categoria: 'familia_presenca', prefix: 'holnat', opts: eventOpts(['natal']) },
    ],
  },
];

let totalNew = 0;
for (const entry of FILES) {
  const challenges = entry.blocks.flatMap((b) => buildBlock(b.raw, b.categoria, b.prefix, b.opts));
  writeFile(entry.file, entry.varName, challenges);
  totalNew += challenges.length;
}

console.log(`Total de desafios novos gerados: ${totalNew}`);
console.log('Concluído.');

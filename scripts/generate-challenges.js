// Uso: node scripts/generate-challenges.js
//
// Gera os 9 arquivos de dados em src/data/challenges/ a partir da base oficial
// de 900 desafios (texto bruto embutido abaixo, verbatim). Cada linha numerada
// vira um objeto Challenge; metadados que a base oficial não especifica
// (tempoEstimado, nivel, tipo, horariosIdeais) são inferidos por heurística —
// nenhum desses campos afeta a seleção de forma crítica (ver ChallengeEngine/scoring).
'use strict';
const heuristics = require('./challengeHeuristics');
const { parseLines, writeFile } = heuristics;

// ---------------------------------------------------------------------------
// Texto bruto oficial, por categoria
// ---------------------------------------------------------------------------

const DEVELOPMENT_RAW = `
1. Escreva uma coisa que você gostaria de melhorar em si mesmo.
2. Anote uma coisa que você fez bem hoje.
3. Pense em uma decisão que você está adiando e dê o primeiro passo.
4. Passe 5 minutos em silêncio, sem celular.
5. Escreva uma preocupação e uma possível ação sobre ela.
6. Identifique uma coisa que está sob seu controle hoje.
7. Identifique uma coisa que você precisa parar de tentar controlar.
8. Faça algo pequeno que você vem adiando.
9. Escreva uma meta para os próximos 7 dias.
10. Escolha uma ação de hoje que aproxime você dessa meta.
11. Anote uma coisa que aprendeu esta semana.
12. Pense em um erro recente e escreva o que ele ensinou.
13. Perdoe a si mesmo por uma pequena falha.
14. Pare de se comparar com outras pessoas durante o restante do dia.
15. Faça algo sozinho que normalmente faria acompanhado.
16. Experimente uma maneira diferente de realizar uma tarefa comum.
17. Pergunte a alguém em quem confia qual qualidade mais admira em você.
18. Pergunte a alguém em quem confia o que você poderia melhorar.
19. Faça uma coisa que normalmente evita por insegurança.
20. Admita para alguém que você não sabe alguma coisa.
21. Peça ajuda em algo que está tentando resolver sozinho.
22. Diga "não" a uma solicitação que realmente não pode assumir.
23. Aceite um elogio sem diminuí-lo.
24. Faça algo criativo durante 10 minutos.
25. Escreva livremente durante 5 minutos.
26. Fotografe alguma coisa bonita que você normalmente ignora.
27. Observe seu ambiente durante 2 minutos sem mexer no celular.
28. Escreva três coisas pelas quais você é grato.
29. Pense em uma pessoa que mudou sua vida positivamente.
30. Mande uma mensagem agradecendo essa pessoa.
31. Relembre uma conquista que você quase esqueceu.
32. Escreva como você gostaria de estar daqui a um ano.
33. Escolha uma pequena ação que seu "eu do futuro" agradeceria.
34. Faça hoje uma coisa que você prometeu a si mesmo.
35. Termine algo que começou e abandonou.
36. Recomece algo importante que abandonou.
37. Identifique um hábito que está ajudando você.
38. Identifique um hábito que está atrapalhando você.
39. Passe uma hora sem reclamar de pequenas coisas.
40. Quando surgir uma reclamação, tente transformá-la em uma ação.
41. Antes de responder algo irritante, respire cinco vezes.
42. Escolha responder em vez de reagir.
43. Nomeie o que você está sentindo neste momento.
44. Pergunte a si mesmo o que pode ter provocado esse sentimento.
45. Faça uma tarefa difícil antes de uma tarefa fácil.
46. Escolha uma pequena decisão e tome-a imediatamente.
47. Pare de pesquisar uma decisão que já tem informação suficiente para tomar.
48. Faça uma coisa sem buscar aprovação de ninguém.
49. Dê sua opinião de forma honesta e respeitosa.
50. Reconheça uma opinião diferente sem tentar mudá-la.
51. Passe 30 minutos sem redes sociais.
52. Desative uma notificação que não acrescenta nada à sua vida.
53. Retire um aplicativo que você não usa.
54. Organize a tela inicial do celular.
55. Deixe o celular longe durante uma atividade importante.
56. Faça uma refeição sem olhar para uma tela.
57. Fique 10 minutos sem nenhum estímulo digital.
58. Faça uma atividade inteira sem multitarefa.
59. Termine uma tarefa antes de começar outra.
60. Pergunte "qual é o próximo passo?" quando se sentir perdido.
61. Escreva uma pergunta que você gostaria de responder.
62. Pesquise a resposta para essa pergunta.
63. Aprenda uma palavra nova.
64. Leia duas páginas de um livro.
65. Ouça 10 minutos de conteúdo educativo.
66. Aprenda algo com uma pessoa mais experiente.
67. Ensine alguém algo que você sabe.
68. Explique uma ideia difícil usando palavras simples.
69. Faça uma pergunta que normalmente teria vergonha de fazer.
70. Experimente algo novo hoje.
71. Faça algo que você sabe que será bom para você, mesmo sem vontade.
72. Reconheça uma pequena vitória.
73. Celebre uma conquista de outra pessoa.
74. Pare por um minuto e observe sua respiração.
75. Faça cinco respirações lentas antes de uma decisão.
76. Faça uma pausa antes de responder uma mensagem importante.
77. Escreva uma coisa que você gostaria de deixar para trás.
78. Escreva uma coisa que gostaria de levar para o futuro.
79. Pense em uma pessoa que você precisa perdoar.
80. Pense em uma pessoa para quem precisa pedir perdão.
81. Se for apropriado, peça desculpas por algo específico.
82. Reconheça um erro sem tentar justificá-lo.
83. Faça algo que aumente sua confiança.
84. Vista-se de uma maneira que faça você se sentir bem.
85. Organize um pequeno espaço que esteja incomodando você.
86. Faça uma tarefa imediatamente em vez de colocá-la na lista.
87. Escolha uma coisa para não fazer hoje.
88. Reserve 10 minutos para descansar de verdade.
89. Faça algo divertido sem transformar isso em produtividade.
90. Pense em uma coisa que gostaria de aprender.
91. Dê um pequeno passo para aprender essa coisa.
92. Escreva uma frase que gostaria de lembrar amanhã.
93. Anote algo que deu certo hoje.
94. Anote algo que faria diferente hoje.
95. Pense em uma dificuldade que você já superou.
96. Faça uma escolha alinhada com aquilo que considera importante.
97. Faça hoje uma coisa que seu futuro eu agradecerá.
98. Reconheça que progresso pequeno ainda é progresso.
99. Termine o dia escrevendo: "Hoje eu avancei em..."
100. Escolha uma pequena atitude que torne amanhã um pouco melhor.
`;

const RELATIONSHIPS_RAW = `
1. Ligue para alguém com quem você não fala há algum tempo.
2. Envie uma mensagem dizendo que sente saudade.
3. Diga "eu te amo" para alguém importante.
4. Pergunte a alguém como foi realmente o dia dela.
5. Faça um elogio sincero.
6. Agradeça alguém por algo específico.
7. Diga a alguém uma qualidade que você admira nela.
8. Mande uma mensagem de bom dia para alguém especial.
9. Mande uma mensagem de boa noite para alguém especial.
10. Pergunte a alguém o que está fazendo essa pessoa feliz.
11. Pergunte a alguém o que está preocupando essa pessoa.
12. Ouça alguém por cinco minutos sem interromper.
13. Durante uma conversa, deixe o celular de lado.
14. Pergunte antes de oferecer uma solução para um problema.
15. Reconheça o esforço de alguém.
16. Parabenize alguém por uma pequena conquista.
17. Envie uma mensagem de incentivo para alguém.
18. Pergunte a alguém qual é seu sonho atual.
19. Pergunte a alguém qual lugar gostaria de conhecer.
20. Pergunte qual foi a melhor parte da semana de alguém.
21. Pergunte o que alguém gostaria de aprender.
22. Compartilhe uma memória boa com alguém.
23. Envie uma foto que lembre um momento feliz.
24. Envie uma música para alguém.
25. Envie uma frase que fez você lembrar de alguém.
26. Ligue para um amigo antigo.
27. Mande mensagem para um parente distante.
28. Responda uma mensagem que você está adiando.
29. Faça uma chamada de vídeo curta com alguém.
30. Envie um áudio em vez de apenas escrever.
31. Pergunte a alguém se precisa de ajuda.
32. Ofereça ajuda em uma tarefa.
33. Faça uma pequena gentileza sem avisar.
34. Faça uma tarefa que normalmente outra pessoa faz.
35. Dê atenção exclusiva a alguém durante 10 minutos.
36. Faça uma refeição com alguém sem celular.
37. Convide alguém para conversar.
38. Pergunte a alguém se quer conversar.
39. Não transforme uma conversa em disputa.
40. Faça uma pergunta antes de dar sua opinião.
41. Reconheça o ponto de vista de alguém mesmo discordando.
42. Evite uma crítica desnecessária hoje.
43. Troque uma reclamação por um pedido claro.
44. Dê crédito a alguém por uma ideia.
45. Agradeça alguém que costuma ajudar você.
46. Agradeça alguém cujo trabalho normalmente passa despercebido.
47. Recomende o trabalho de alguém. 📱
48. Indique um pequeno negócio de alguém conhecido. 📱
49. Compartilhe uma oportunidade com alguém. 📱
50. Pergunte a um colega como está sua semana.
51. Cumprimente pelo nome alguém que você encontra frequentemente.
52. Dê bom dia a alguém que costuma passar despercebido.
53. Pergunte a uma pessoa mais velha sobre uma lembrança da juventude.
54. Pergunte a uma criança o que ela está aprendendo.
55. Brinque com uma criança durante 10 minutos.
56. Pergunte ao seu parceiro como você pode tornar o dia melhor.
57. Pergunte aos seus filhos qual foi a melhor parte do dia.
58. Faça uma brincadeira espontânea com sua família.
59. Guarde o celular durante uma conversa importante.
60. Ouça uma história sem tentar contar uma história melhor.
61. Pergunte: "Como posso estar mais presente para você?"
62. Faça uma gentileza para um vizinho.
63. Dê feedback positivo a um colega.
64. Reconheça alguém que fez um bom trabalho.
65. Envie uma mensagem para alguém que está começando algo novo.
66. Pergunte como foi algo importante que aconteceu ontem.
67. Comemore a vitória de outra pessoa. 📱
68. Pergunte a alguém sobre um sonho antigo.
69. Pergunte qual foi a viagem favorita de alguém.
70. Pergunte qual comida lembra a infância de alguém.
71. Pergunte qual música sempre melhora o humor de alguém.
72. Descubra algo novo sobre uma pessoa que você conhece há anos.
73. Faça uma pergunta que nunca fez a um familiar.
74. Relembre uma história engraçada da família.
75. Envie uma foto antiga para alguém.
76. Ligue para alguém em vez de mandar mensagem.
77. Peça desculpas se existe uma conversa pendente.
78. Resolva uma pequena mágoa com respeito.
79. Diga "eu entendo" antes de explicar seu ponto.
80. Deixe alguém terminar de falar.
81. Pergunte "você quer conselho ou só quer que eu escute?"
82. Diga obrigado sem acrescentar "mas".
83. Diga a alguém que você acredita nela.
84. Incentive alguém que está desanimado.
85. Pergunte a um amigo como você pode ajudá-lo.
86. Faça companhia a alguém que esteja sozinho.
87. Visite alguém próximo, se for conveniente.
88. Faça uma surpresa simples para alguém.
89. Deixe um bilhete carinhoso.
90. Faça uma tarefa para aliviar alguém.
91. Compartilhe uma lembrança que você valoriza.
92. Conte para alguém por que essa pessoa é importante.
93. Diga a alguém algo que você deveria ter dito há muito tempo.
94. Agradeça alguém por ter entrado na sua vida.
95. Pergunte a alguém o que gostaria de fazer juntos.
96. Marque um momento para vocês se encontrarem.
97. Faça hoje uma demonstração de carinho que normalmente você só pensa.
98. Não espere uma ocasião especial para demonstrar carinho.
99. Escolha uma pessoa para receber sua atenção completa hoje.
100. Termine o dia dizendo a alguém: "Fico feliz que você faça parte da minha vida."
`;

const FAMILY_RAW = `
1. Faça uma refeição com a família sem celular.
2. Pergunte como foi o dia de cada pessoa da casa.
3. Brinque 10 minutos com uma criança.
4. Ajude espontaneamente em uma tarefa doméstica.
5. Guarde algo que outra pessoa deixou fora do lugar.
6. Prepare uma bebida para alguém da casa.
7. Prepare um lanche simples para alguém.
8. Pergunte ao seu parceiro como foi o dia.
9. Pergunte aos seus filhos o que mais gostaram hoje.
10. Ouça uma história de alguém da família.
11. Conte uma lembrança da sua infância.
12. Mostre uma foto antiga para alguém.
13. Relembre uma viagem em família.
14. Escolha uma música para ouvir juntos.
15. Faça uma brincadeira em família.
16. Assistam a algo curto juntos sem celulares.
17. Faça uma caminhada curta com alguém da família.
18. Convide alguém da casa para conversar.
19. Ajude uma criança em uma pequena tarefa.
20. Pergunte o que alguém gostaria de fazer no fim de semana.
21. Pergunte qual foi a melhor coisa do dia.
22. Pergunte se alguém precisa de ajuda amanhã.
23. Prepare alguma coisa para facilitar a manhã de alguém.
24. Organize a mochila de uma criança.
25. Confira se algo importante da família está preparado.
26. Organize um espaço comum da casa.
27. Limpe uma área usada por todos.
28. Guarde objetos espalhados pela casa.
29. Faça uma tarefa doméstica sem ser solicitado.
30. Troque uma reclamação por uma ação prática.
31. Agradeça alguém da família por uma tarefa.
32. Elogie uma atitude positiva de alguém.
33. Diga algo carinhoso para alguém.
34. Diga "eu te amo".
35. Diga "estou feliz por ter você".
36. Dê um abraço, se houver consentimento.
37. Pergunte se alguém quer companhia.
38. Deixe outra pessoa escolher o filme.
39. Deixe outra pessoa escolher a música.
40. Faça uma pequena surpresa.
41. Deixe um bilhete carinhoso.
42. Envie uma mensagem carinhosa para alguém da casa.
43. Guarde o celular durante uma conversa.
44. Ouça sem interromper.
45. Pergunte antes de dar conselhos.
46. Perceba se alguém está cansado.
47. Ofereça uma pausa para alguém sobrecarregado.
48. Assuma uma tarefa que aliviará outra pessoa.
49. Prepare alguma coisa para amanhã.
50. Pergunte se alguém precisa de alguma coisa antes de sair.
51. Pergunte a uma criança o que gostaria de aprender.
52. Ensine algo simples a uma criança.
53. Deixe uma criança ensinar algo a você.
54. Pergunte sobre o desenho, jogo ou interesse de uma criança.
55. Passe 10 minutos brincando sem celular.
56. Leia algumas páginas com uma criança.
57. Pergunte a um adolescente como estão as coisas.
58. Escute sem transformar a conversa em sermão.
59. Ligue para um familiar que mora longe.
60. Envie uma foto do seu dia para alguém da família. 📱
61. Compartilhe uma pequena conquista com sua família. 📱
62. Pergunte sobre um sonho antigo.
63. Pergunte sobre um lugar que alguém gostaria de conhecer.
64. Pergunte sobre uma comida favorita.
65. Prepare uma comida que alguém gosta.
66. Organize um pequeno lanche em família.
67. Faça uma tarefa chata acompanhado.
68. Arrume uma área enquanto conversa com alguém.
69. Guarde as compras sem esperar alguém pedir.
70. Verifique se há lixo para retirar.
71. Deixe a cozinha organizada para a próxima pessoa.
72. Deixe o banheiro organizado depois de usar.
73. Coloque alguma coisa de volta no lugar.
74. Resolva uma pequena pendência familiar.
75. Confirme um compromisso da família.
76. Adicione um compromisso importante à agenda.
77. Planeje uma atividade simples para o fim de semana.
78. Escolha uma atividade gratuita para fazer juntos.
79. Passe 15 minutos sem televisão conversando.
80. Faça uma pergunta diferente durante o jantar.
81. Pergunte o que alguém aprendeu hoje.
82. Pergunte o que deixou alguém feliz hoje.
83. Pergunte o que deixou alguém frustrado.
84. Pergunte como você pode ajudar amanhã.
85. Reconheça uma pequena conquista de alguém.
86. Comemore uma pequena vitória da família.
87. Faça uma gentileza sem contar que foi você.
88. Ajude alguém antes que peça.
89. Faça uma tarefa que normalmente outra pessoa faz.
90. Tire alguns minutos para brincar com seu filho.
91. Pergunte a alguém da casa como está se sentindo.
92. Diga algo positivo durante o jantar.
93. Faça uma foto espontânea em família.
94. Relembre uma história engraçada da família.
95. Conte uma história da sua infância.
96. Pergunte aos filhos qual é o sonho deles.
97. Pergunte ao parceiro qual é um objetivo atual.
98. Escolha uma noite para ficarem sem celulares por 30 minutos.
99. Faça algo hoje que torne a vida da sua família um pouco mais fácil.
100. Termine o dia com uma palavra positiva para cada pessoa da casa.
`;

const WORK_RAW = `
1. Escolha a tarefa mais importante de hoje.
2. Trabalhe 10 minutos sem redes sociais.
3. Responda uma mensagem de trabalho pendente.
4. Resolva uma tarefa que leva menos de 2 minutos.
5. Organize sua área de trabalho.
6. Feche cinco abas desnecessárias.
7. Escreva as três prioridades do dia.
8. Escolha uma tarefa que pode ser delegada.
9. Anote uma ideia antes que esqueça.
10. Conclua uma pequena tarefa antes de abrir redes sociais.
11. Separe 10 minutos para uma tarefa adiada.
12. Revise sua agenda.
13. Verifique o que precisa ser entregue amanhã.
14. Separe os arquivos necessários para a próxima tarefa.
15. Renomeie um arquivo importante.
16. Organize uma pasta bagunçada.
17. Exclua cinco arquivos desnecessários.
18. Responda primeiro uma mensagem realmente urgente.
19. Marque uma tarefa já concluída.
20. Verifique se uma reunião ainda é necessária.
21. Confirme um compromisso importante.
22. Anote o próximo passo de um projeto parado.
23. Divida uma tarefa grande em três passos.
24. Comece o primeiro passo de uma tarefa difícil.
25. Faça 15 minutos de trabalho concentrado.
26. Coloque o celular fora do alcance.
27. Ative o modo não perturbe por 20 minutos.
28. Limpe sua caixa de entrada por 5 minutos.
29. Arquive mensagens que não exigem ação.
30. Responda uma mensagem com uma decisão clara.
31. Defina horário para verificar mensagens novamente.
32. Prepare a lista de amanhã.
33. Anote algo que aprendeu hoje.
34. Registre um problema recorrente.
35. Pense em uma melhoria para um processo.
36. Pergunte a um colega como melhorar uma tarefa.
37. Agradeça alguém que ajudou você.
38. Compartilhe uma informação útil com a equipe.
39. Documente uma solução que encontrou.
40. Crie um checklist para uma tarefa repetitiva.
41. Elimine uma etapa desnecessária de um processo.
42. Organize sua mesa antes de começar.
43. Limpe a área de trabalho do computador.
44. Faça backup de um arquivo importante.
45. Verifique um prazo próximo.
46. Separe os materiais para a próxima atividade.
47. Defina um horário para terminar o trabalho.
48. Faça uma pausa curta depois de concluir uma tarefa.
49. Volte para uma tarefa antes de abrir entretenimento.
50. Trabalhe em uma única tarefa durante 10 minutos.
51. Escreva o que está bloqueando uma tarefa.
52. Peça ajuda sobre um bloqueio real.
53. Tome uma decisão pequena que está adiando.
54. Escolha entre duas opções e avance.
55. Resolva uma pendência administrativa curta.
56. Agende uma tarefa importante.
57. Coloque um lembrete para uma obrigação.
58. Revise uma tarefa antes de enviá-la.
59. Corrija um pequeno erro que você já percebeu.
60. Faça primeiro a parte mais simples de uma tarefa difícil.
61. Defina o resultado esperado antes de começar.
62. Separe cinco minutos para planejar uma reunião.
63. Escreva três pontos antes de uma conversa importante.
64. Prepare uma pergunta para uma reunião.
65. Anote decisões tomadas em uma reunião.
66. Envie um resumo depois de uma reunião importante.
67. Organize os próximos passos de um projeto.
68. Dê retorno para alguém esperando sua resposta.
69. Revise uma meta profissional.
70. Escolha uma habilidade profissional para desenvolver.
71. Dedique 10 minutos a essa habilidade.
72. Pesquise uma solução para um problema recorrente.
73. Teste uma pequena melhoria no seu trabalho.
74. Pare uma tarefa quando o objetivo estiver alcançado.
75. Defina o próximo passo antes de encerrar uma tarefa.
76. Faça uma coisa que está procrastinando há dias.
77. Elimine uma notificação desnecessária.
78. Cancele um e-mail promocional que não lê.
79. Limpe cinco itens da sua lista de tarefas.
80. Separe uma tarefa para amanhã.
81. Anote algo que funcionou bem hoje.
82. Anote algo que poderia melhorar amanhã.
83. Termine o expediente deixando sua mesa organizada.
84. Prepare o ambiente para amanhã.
85. Escolha uma tarefa para fazer primeiro amanhã.
86. Defina uma pequena vitória para amanhã.
87. Reconheça uma tarefa que você concluiu.
88. Pergunte "qual é o próximo passo?" antes de parar.
89. Dedique 10 minutos à tarefa mais valiosa do dia.
90. Finalize uma pendência de menos de cinco minutos.
91. Comece uma tarefa sem esperar motivação.
92. Termine uma tarefa antes de abrir outra.
93. Remova uma distração do ambiente.
94. Organize uma informação que está espalhada.
95. Anote uma ideia de melhoria para sua empresa.
96. Faça uma pergunta que pode economizar tempo.
97. Agradeça um colega pelo trabalho realizado.
98. Dê um feedback positivo sincero.
99. Faça hoje uma tarefa que facilitará seu trabalho amanhã.
100. Termine o dia sabendo qual será sua primeira tarefa amanhã.
`;

const HEALTH_RAW = `
1. Beba um copo grande de água agora.
2. Levante-se e caminhe por 3 minutos.
3. Faça 10 agachamentos, se forem seguros para você.
4. Faça 10 movimentos de levantar e sentar da cadeira.
5. Alongue o pescoço por 1 minuto.
6. Alongue os ombros por 1 minuto.
7. Alongue as pernas por 2 minutos.
8. Faça 20 elevações de panturrilha.
9. Faça 10 rotações de ombros.
10. Faça 10 movimentos suaves de tornozelo.
11. Faça 5 respirações lentas.
12. Passe 5 minutos longe do celular.
13. Caminhe pela casa durante 5 minutos.
14. Fique em pé durante uma ligação.
15. Olhe para longe da tela por 2 minutos.
16. Tome água antes da próxima refeição.
17. Prepare uma garrafa de água para ficar perto.
18. Escolha água em vez de uma bebida açucarada.
19. Prepare uma fruta para o próximo lanche.
20. Adicione um vegetal à próxima refeição.
21. Adicione uma fonte de proteína à próxima refeição.
22. Faça a próxima refeição sem assistir vídeos.
23. Coma a próxima refeição mais devagar.
24. Use um prato em vez de comer diretamente da embalagem.
25. Perceba seu nível de fome antes de comer.
26. Perceba sua saciedade depois de comer.
27. Faça uma caminhada curta depois de uma refeição.
28. Faça 2 minutos de mobilidade antes do banho.
29. Faça 2 minutos de mobilidade ao acordar.
30. Faça 2 minutos de alongamento antes de dormir.
31. Faça 10 elevações de joelho alternadas.
32. Faça 10 passos laterais para cada lado.
33. Faça 10 movimentos de braços.
34. Faça 1 minuto de mobilidade dos quadris.
35. Faça 1 minuto de mobilidade da coluna.
36. Faça 1 minuto de mobilidade dos punhos.
37. Faça 1 minuto de mobilidade dos tornozelos.
38. Dance uma música inteira.
39. Faça 5 minutos de uma atividade física que você gosta.
40. Coloque uma roupa confortável para se movimentar.
41. Aproveite alguns minutos de luz natural pela manhã.
42. Faça uma pausa de movimento entre duas tarefas.
43. Levante-se sempre que terminar uma tarefa curta.
44. Caminhe enquanto espera algo carregar.
45. Use escadas se for seguro e possível.
46. Faça 10 movimentos de sentar e levantar.
47. Faça uma pequena caminhada ao ar livre.
48. Faça uma pausa para respirar antes de uma tarefa estressante.
49. Relaxe conscientemente a mandíbula.
50. Solte os ombros e respire cinco vezes.
51. Abra e feche as mãos dez vezes.
52. Faça movimentos suaves de braços acima da cabeça.
53. Faça 10 movimentos de extensão das pernas.
54. Faça 10 elevações dos calcanhares.
55. Faça uma pausa visual durante o trabalho.
56. Reduza a luminosidade da tela à noite.
57. Deixe o celular longe da cama.
58. Prepare o ambiente para dormir 15 minutos mais cedo.
59. Evite uma tela nos últimos 10 minutos antes de dormir.
60. Faça cinco respirações lentas antes de deitar.
61. Organize o quarto para ficar mais confortável.
62. Ventile o quarto por alguns minutos.
63. Prepare sua garrafa de água para amanhã.
64. Deixe uma fruta visível.
65. Deixe uma opção saudável pronta.
66. Retire um alimento que está sobrando e organize para consumo.
67. Faça uma refeição sentado.
68. Evite comer diretamente em frente ao computador.
69. Faça uma pausa de 3 minutos depois de muito tempo sentado.
70. Faça 10 agachamentos enquanto espera algo, se for seguro.
71. Faça elevações de panturrilha enquanto escova os dentes.
72. Caminhe durante uma ligação curta.
73. Faça uma sequência de movimentos por 5 minutos.
74. Alongue as costas por 2 minutos.
75. Faça movimentos suaves de rotação do tronco.
76. Respire lentamente antes de responder uma mensagem irritante.
77. Beba água antes de abrir uma rede social. 📱
78. Faça uma pequena caminhada antes de assistir televisão.
79. Fique 10 minutos sem nenhuma tela.
80. Faça uma atividade física curta que você realmente goste.
81. Prepare o que precisa para se exercitar amanhã.
82. Coloque um lembrete para uma pausa de movimento.
83. Passe alguns minutos em pé durante o dia.
84. Faça uma pausa para relaxar os olhos.
85. Faça cinco respirações pelo nariz.
86. Observe se está tensionando os ombros.
87. Ajuste sua posição na cadeira.
88. Apoie os pés corretamente durante o trabalho.
89. Faça movimentos leves depois de ficar muito tempo parado.
90. Faça uma pequena caminhada dentro de casa.
91. Escolha uma bebida sem açúcar na próxima refeição.
92. Prepare água para levar quando sair.
93. Faça a próxima refeição sem celular.
94. Pare alguns segundos antes de repetir comida e perceba sua saciedade.
95. Escolha uma opção menos processada na próxima refeição.
96. Faça uma pausa de respiração antes de dormir.
97. Prepare seu ambiente para uma noite mais tranquila.
98. Faça algo hoje que ajude seu corpo a se recuperar.
99. Escolha um movimento que você goste e faça por 5 minutos.
100. Termine o dia preparando seu corpo para descansar.
`;

const FINANCE_RAW = `
1. Verifique seu saldo.
2. Veja quanto gastou hoje.
3. Confira suas compras das últimas 24 horas.
4. Anote uma despesa de hoje.
5. Identifique um gasto pequeno que se repete.
6. Escolha um gasto pequeno para reduzir.
7. Confira uma assinatura que você paga.
8. Cancele uma assinatura que não utiliza.
9. Confira se existe alguma cobrança recorrente esquecida.
10. Verifique uma conta que vence nesta semana.
11. Separe o dinheiro de uma conta importante.
12. Anote uma despesa fixa mensal.
13. Anote uma despesa variável recente.
14. Defina um pequeno valor para guardar.
15. Se puder, transfira esse valor para sua reserva.
16. Confira quanto já conseguiu economizar.
17. Anote uma compra que não valeu a pena.
18. Anote uma compra que realmente valeu a pena.
19. Identifique uma categoria que está consumindo muito dinheiro.
20. Observe essa categoria durante os próximos sete dias.
21. Evite uma compra por impulso hoje.
22. Espere 24 horas antes de comprar algo não essencial.
23. Coloque uma compra desejada em uma lista em vez de comprar.
24. Compare preços antes de comprar.
25. Não compre algo apenas porque está em promoção.
26. Pergunte se realmente precisa de um item.
27. Leve água de casa.
28. Prepare um lanche em casa para amanhã.
29. Evite pedir comida por impulso hoje.
30. Use primeiro algo que já possui em casa.
31. Faça uma lista antes de ir ao mercado.
32. Confira a despensa antes de comprar.
33. Separe alimentos que estão próximos do vencimento.
34. Compare o preço por quantidade de dois produtos.
35. Procure uma alternativa mais barata.
36. Pesquise se existe uma opção gratuita antes de pagar.
37. Conserte algo antes de comprar outro.
38. Reutilize algo que já possui.
39. Separe algo que pode ser vendido.
40. Fotografe um item que deseja vender.
41. Publique um item usado que está parado.
42. Separe uma roupa para doação.
43. Verifique uma compra parcelada.
44. Confira quantas parcelas ainda faltam.
45. Verifique uma dívida que precisa de atenção.
46. Anote o próximo passo para uma dívida.
47. Evite aumentar uma dívida hoje.
48. Pesquise uma alternativa antes de contratar um serviço.
49. Pergunte se existe desconto em uma compra planejada.
50. Confira benefícios ou pontos que você já possui.
51. Verifique se algum benefício está perto de expirar.
52. Espere 10 minutos antes de uma compra impulsiva.
53. Anote o motivo real de uma compra desejada.
54. Pergunte: "Eu realmente usaria isso?"
55. Pergunte: "Isso resolve um problema real?"
56. Pergunte: "Posso pagar sem comprometer uma conta?"
57. Faça uma refeição usando o que já existe em casa.
58. Planeje uma refeição econômica para amanhã.
59. Revise seu orçamento semanal.
60. Defina um limite de gasto para amanhã.
61. Verifique desperdícios de comida em casa.
62. Planeje como usar um alimento antes que vença.
63. Verifique uma tarifa bancária.
64. Veja se existe uma tarifa que pode ser reduzida.
65. Confira se algum serviço aumentou de preço.
66. Pesquise uma alternativa para um serviço caro.
67. Revise um contrato que está sendo pouco utilizado.
68. Organize um comprovante importante.
69. Guarde uma nota fiscal necessária.
70. Verifique uma garantia que está perto de vencer.
71. Anote uma despesa anual que costuma esquecer.
72. Divida uma despesa futura em pequenos objetivos.
73. Defina uma meta financeira para os próximos sete dias.
74. Faça um dia sem compras não essenciais.
75. Faça uma refeição sem pedir delivery.
76. Vá às compras com uma lista.
77. Evite comprar por influência de propaganda.
78. Remova um produto do carrinho antes de pagar.
79. Revise o carrinho antes de finalizar.
80. Compare duas opções antes de contratar algo.
81. Pesquise uma alternativa usada antes de comprar novo.
82. Anote uma lição aprendida com um gasto passado.
83. Guarde o dinheiro que economizou hoje.
84. Verifique quanto custa um hábito semanal.
85. Pense no custo mensal de um gasto recorrente.
86. Escolha uma economia para praticar amanhã.
87. Ensine alguém da família uma dica de economia.
88. Converse com a família sobre uma meta financeira.
89. Planeje uma atividade gratuita para o fim de semana.
90. Troque um entretenimento pago por uma opção gratuita.
91. Evite uma compra motivada por ansiedade.
92. Não abra uma loja online sem intenção de comprar.
93. Tire um produto desnecessário da lista de desejos.
94. Faça uma pequena organização financeira de 5 minutos.
95. Verifique se há uma conta esquecida.
96. Anote uma meta que gostaria de alcançar financeiramente.
97. Pense em uma habilidade que poderia aumentar sua renda.
98. Dedique 10 minutos a essa habilidade.
99. Tome uma decisão financeira consciente hoje.
100. Termine o dia sem nenhuma compra impulsiva.
`;

const LEARNING_RAW = `
1. Aprenda uma palavra nova.
2. Pesquise a origem do seu nome.
3. Descubra algo sobre a cidade onde mora.
4. Aprenda uma curiosidade sobre seu país.
5. Pesquise como algo que você usa diariamente funciona.
6. Aprenda um atalho do computador.
7. Aprenda um atalho do celular.
8. Descubra uma função escondida de um aplicativo.
9. Leia duas páginas de um livro.
10. Leia algo sobre ciência.
11. Leia algo sobre economia.
12. Assista a uma aula curta.
13. Ouça 10 minutos de um podcast educativo.
14. Aprenda uma frase em outro idioma.
15. Aprenda cinco palavras de outro idioma.
16. Pesquise a origem de uma expressão.
17. Descubra quem inventou alguma coisa que você usa.
18. Pesquise como uma tecnologia funciona.
19. Aprenda uma curiosidade sobre o corpo humano.
20. Aprenda uma curiosidade sobre o espaço.
21. Aprenda uma curiosidade sobre animais.
22. Aprenda uma curiosidade histórica.
23. Aprenda uma curiosidade geográfica.
24. Aprenda uma curiosidade sobre música.
25. Aprenda uma curiosidade sobre cinema.
26. Aprenda uma curiosidade sobre culinária.
27. Aprenda uma curiosidade sobre comportamento.
28. Pesquise a história de uma invenção.
29. Pesquise a história de uma profissão.
30. Pesquise como uma empresa começou.
31. Pesquise como um produto é fabricado.
32. Descubra como funciona o GPS.
33. Descubra como funciona a internet.
34. Descubra como funciona uma bateria.
35. Descubra como funciona um motor.
36. Descubra como funciona uma câmera.
37. Pesquise o significado de uma expressão popular.
38. Descubra a origem de um ditado.
39. Conheça uma obra de arte famosa.
40. Conheça um artista que nunca estudou.
41. Ouça uma música de um gênero que não conhece.
42. Conheça um autor novo.
43. Pesquise um livro que talvez queira ler.
44. Pesquise uma invenção brasileira.
45. Pesquise uma personalidade importante da sua cidade.
46. Aprenda uma regra básica de etiqueta.
47. Aprenda uma técnica simples de memória.
48. Tente memorizar cinco itens sem anotar.
49. Resolva um pequeno enigma.
50. Resolva uma questão de lógica.
51. Aprenda uma palavra relacionada à sua profissão.
52. Aprenda um conceito importante da sua área.
53. Pesquise uma ferramenta que pode ajudar no trabalho.
54. Teste uma função nova de uma ferramenta que já usa.
55. Aprenda uma fórmula útil para o cotidiano.
56. Aprenda uma maneira melhor de organizar informações.
57. Aprenda uma técnica de pesquisa.
58. Descubra como verificar uma informação antes de compartilhá-la.
59. Aprenda a identificar uma fonte confiável.
60. Compare duas explicações sobre o mesmo assunto.
61. Faça uma pergunta sobre algo que não entende.
62. Pergunte a alguém sobre uma habilidade que domina.
63. Aprenda algo com uma pessoa mais experiente.
64. Ensine alguém algo que acabou de aprender.
65. Explique para você mesmo o que aprendeu hoje.
66. Pesquise uma dúvida antiga.
67. Assista a um vídeo educativo curto.
68. Leia o resumo de um livro interessante.
69. Conheça um idioma que nunca estudou.
70. Pesquise como outra cultura faz algo cotidiano.
71. Descubra uma tradição de outro país.
72. Pesquise uma comida típica de outro lugar.
73. Conheça um lugar que gostaria de visitar.
74. Pesquise uma curiosidade sobre seu bairro.
75. Aprenda uma habilidade manual simples.
76. Descubra uma função nova de uma ferramenta doméstica.
77. Descubra uma maneira de economizar tempo.
78. Descubra uma maneira de organizar melhor uma tarefa.
79. Pesquise uma solução para um problema recorrente.
80. Aprenda um conceito financeiro básico.
81. Aprenda uma técnica simples de comunicação.
82. Aprenda uma pergunta que melhora uma conversa.
83. Aprenda uma forma melhor de dar feedback.
84. Aprenda uma forma melhor de receber críticas.
85. Aprenda uma estratégia para reduzir distrações.
86. Aprenda uma técnica para lembrar compromissos.
87. Aprenda algo sobre um assunto que seu filho gosta.
88. Pergunte a alguém para ensinar algo novo.
89. Anote uma curiosidade para pesquisar depois.
90. Compartilhe uma descoberta interessante com alguém. 📱
91. Pesquise por que uma tradição da sua família existe.
92. Descubra algo sobre a história da sua profissão.
93. Pesquise uma pessoa que admira.
94. Descubra uma coisa que aconteceu no mundo no dia em que nasceu.
95. Pesquise o significado de uma palavra que usa frequentemente.
96. Aprenda uma habilidade pequena em 10 minutos.
97. Procure uma explicação para algo que sempre considerou óbvio.
98. Faça uma pergunta para alguém que sabe mais do que você.
99. Conte para alguém uma coisa nova que aprendeu hoje. 📱
100. Escolha uma coisa nova para aprender amanhã.
`;

const COMMUNITY_RAW = `
1. Segure a porta para alguém.
2. Dê passagem a alguém quando for seguro.
3. Agradeça um funcionário pelo atendimento.
4. Cumprimente alguém que costuma passar despercebido.
5. Recolha um pequeno lixo que encontrar no caminho.
6. Deixe um espaço público melhor do que encontrou.
7. Ofereça ajuda a alguém carregando algo.
8. Pergunte a um vizinho se precisa de alguma coisa.
9. Separe um alimento para doação.
10. Separe uma roupa em bom estado para doar.
11. Separe um livro que não usa para doar.
12. Compartilhe uma informação útil.
13. Indique um pequeno negócio local. 📱
14. Deixe uma avaliação positiva quando o serviço merecer. 📱
15. Agradeça publicamente alguém que fez um bom trabalho. 📱
16. Elogie um trabalhador pelo atendimento.
17. Ofereça ajuda a alguém que parece estar com dificuldade.
18. Pergunte se uma pessoa idosa precisa de ajuda.
19. Ajude alguém com uma tarefa simples.
20. Ensine alguém a usar uma função do celular.
21. Compartilhe um recurso gratuito com alguém. 📱
22. Envie uma oportunidade de trabalho para alguém adequado. 📱
23. Indique um profissional competente. 📱
24. Dê crédito a quem realizou o trabalho.
25. Seja paciente em uma fila.
26. Respeite uma regra de convivência mesmo sem fiscalização.
27. Não ocupe mais espaço do que precisa.
28. Devolva algo que encontrou.
29. Ajude alguém a encontrar um endereço.
30. Ofereça orientação a alguém perdido.
31. Faça uma gentileza para um colega.
32. Faça uma gentileza para um vizinho.
33. Faça uma gentileza para um familiar.
34. Deixe alguém escolher primeiro em uma situação simples.
35. Compartilhe algo que você tem e não usa.
36. Ofereça uma carona quando for seguro e conveniente.
37. Compartilhe informação sobre um serviço público útil.
38. Ensine alguém a usar um recurso gratuito.
39. Ajude alguém com uma dúvida.
40. Faça companhia por alguns minutos a alguém sozinho.
41. Ligue para um familiar que mora sozinho.
42. Envie uma mensagem de apoio para alguém. 📱
43. Reconheça o trabalho de alguém que costuma ser invisível.
44. Agradeça quem limpa seu ambiente.
45. Agradeça quem prepara sua comida.
46. Agradeça quem mantém seu ambiente funcionando.
47. Evite compartilhar uma notícia sem verificar. 📱
48. Corrija uma informação falsa com respeito. 📱
49. Informe alguém sobre um objeto perdido.
50. Faça uma gentileza sem esperar retorno.
51. Recolha lixo usando proteção adequada.
52. Separe corretamente materiais recicláveis.
53. Evite desperdiçar água hoje.
54. Apague uma luz desnecessária.
55. Reduza um desperdício de comida.
56. Reutilize uma embalagem útil.
57. Leve uma sacola reutilizável.
58. Escolha uma alternativa que produza menos desperdício.
59. Deixe um ambiente comum organizado.
60. Limpe imediatamente algo que você sujou.
61. Não deixe lixo para outra pessoa recolher.
62. Seja gentil com alguém que está atendendo você.
63. Seja paciente com alguém que está aprendendo.
64. Dê espaço para alguém cometer um pequeno erro.
65. Faça uma crítica de maneira construtiva.
66. Reconheça publicamente uma boa atitude. 📱
67. Compartilhe a conquista de outra pessoa. 📱
68. Faça uma recomendação profissional para alguém. 📱
69. Ajude alguém a encontrar uma informação.
70. Responda uma pergunta que você sabe responder.
71. Ofereça orientação sem impor sua decisão.
72. Pergunte antes de ajudar em algo pessoal.
73. Respeite quando alguém disser não.
74. Seja gentil com alguém que está tendo um dia ruim.
75. Agradeça alguém que normalmente ninguém agradece.
76. Cumprimente um profissional de limpeza.
77. Cumprimente um profissional de segurança.
78. Agradeça um motorista pelo trabalho.
79. Agradeça alguém que presta um serviço para você.
80. Dê espaço para alguém passar.
81. Evite uma discussão desnecessária hoje.
82. Escolha uma resposta educada em uma situação irritante.
83. Faça uma pequena gentileza para um desconhecido.
84. Ajude alguém sem esperar reconhecimento.
85. Compartilhe uma informação que pode facilitar o dia de alguém. 📱
86. Ofereça seu lugar quando fizer sentido.
87. Ajude alguém a carregar algo, se a pessoa aceitar.
88. Pergunte a alguém se precisa de orientação.
89. Faça algo para melhorar o ambiente ao seu redor.
90. Recolha um objeto que está atrapalhando a passagem.
91. Organize algo que todos utilizam.
92. Deixe uma avaliação positiva para alguém que merece. 📱
93. Recomende alguém para uma oportunidade. 📱
94. Compartilhe uma habilidade gratuitamente. 📱
95. Faça algo que facilite o trabalho de outra pessoa.
96. Escolha uma pessoa para ajudar hoje.
97. Faça uma gentileza sem contar para ninguém.
98. Observe quem ao seu redor poderia precisar de ajuda.
99. Faça uma ação que torne o dia de alguém melhor.
100. Termine o dia pensando em uma pessoa cujo dia você melhorou.
`;

// A base de fé tem subseções — cada bloco abaixo tem uma tag e um viés de "tipo".
const FAITH_SECTIONS = [
  {
    tag: 'leitura',
    tipoBias: 'reflexao',
    raw: `
1. Leia o Salmo 23 antes de dormir.
2. Leia o Salmo 91 e reflita por alguns minutos.
3. Leia Provérbios 3:5–6.
4. Leia Filipenses 4:6–7.
5. Leia João 15:12.
6. Leia Romanos 12:2.
7. Leia Tiago 1:19.
8. Leia Efésios 4:32.
9. Leia Mateus 5:9.
10. Leia um capítulo curto do Evangelho de Marcos.
11. Leia um Salmo que você nunca leu.
12. Leia um trecho bíblico sobre esperança.
13. Leia um trecho sobre perdão.
14. Leia um trecho sobre amor ao próximo.
15. Leia um trecho sobre gratidão.
16. Leia um trecho sobre sabedoria.
17. Leia um trecho sobre coragem.
18. Leia um trecho sobre paciência.
19. Leia um trecho sobre compaixão.
20. Leia um trecho sobre servir ao próximo.
21. Escolha um versículo para levar com você durante o dia.
22. Leia novamente um trecho que já trouxe conforto para você.
23. Leia uma passagem e anote uma frase que chamou sua atenção.
24. Leia um Salmo e fique alguns minutos em silêncio.
25. Antes de dormir, leia um pequeno trecho da Bíblia.
`,
  },
  {
    tag: 'oracao',
    tipoBias: 'reflexao',
    raw: `
26. Faça uma oração de dois minutos agradecendo pelo seu dia.
27. Ore por alguém da sua família.
28. Ore por um amigo que esteja passando por dificuldades.
29. Ore por sabedoria antes de tomar uma decisão.
30. Ore por alguém que você não vê há algum tempo.
31. Ore por alguém que esteja enfrentando uma dificuldade.
32. Reserve três minutos para falar com Deus sem distrações.
33. Comece sua manhã com uma oração simples.
34. Antes de dormir, entregue suas preocupações a Deus.
35. Ore por alguém com quem você teve um desentendimento.
36. Ore por alguém que precisa de esperança.
37. Ore agradecendo por uma conquista recente.
38. Faça uma oração antes de uma tarefa importante.
39. Ore por sua família.
40. Ore por alguém que está começando algo novo.
41. Ore por alguém que está procurando emprego.
42. Ore por alguém que está estudando para alcançar um objetivo.
43. Ore por alguém que você sabe que está cansado.
44. Ore por uma pessoa que você não sabe como ajudar.
45. Faça uma oração silenciosa por alguém que cruzar seu caminho.
`,
  },
  {
    tag: 'gratidao',
    tipoBias: 'reflexao',
    raw: `
46. Escreva três coisas pelas quais você agradece a Deus hoje.
47. Agradeça a Deus por uma pessoa importante na sua vida.
48. Pare por um minuto e reconheça algo bom que aconteceu hoje.
49. Agradeça por uma oportunidade que recebeu.
50. Agradeça por algo simples que normalmente passa despercebido.
51. Pense em uma dificuldade que você já conseguiu superar.
52. Lembre-se de um momento em que recebeu ajuda.
53. Agradeça por uma pequena conquista de hoje.
54. Compartilhe com alguém algo pelo qual você é grato. 📱
55. Mande uma mensagem agradecendo alguém que fez diferença na sua vida. 📱
56. Agradeça a alguém que costuma cuidar de você.
57. Agradeça a Deus por algo que você tem hoje e antes desejava.
58. Antes de dormir, lembre de três coisas boas do dia.
59. Observe algo bonito na natureza e agradeça.
60. Faça uma pausa e reconheça que pequenas coisas também são motivos de gratidão.
`,
  },
  {
    tag: 'fe_pratica',
    tipoBias: 'acao',
    raw: `
61. Faça uma gentileza sem esperar reconhecimento.
62. Ajude alguém que esteja precisando.
63. Envie uma mensagem de esperança para alguém. 📱
64. Diga a alguém: "Estou orando por você."
65. Incentive alguém que esteja desanimado. 📱
66. Perdoe uma pequena ofensa, se estiver preparado para isso.
67. Procure uma oportunidade de servir alguém hoje.
68. Faça uma tarefa para aliviar o dia de outra pessoa.
69. Visite ou ligue para alguém que esteja sozinho.
70. Compartilhe uma palavra de esperança com alguém. 📱
71. Reconheça publicamente uma atitude boa de alguém. 📱
72. Ofereça ajuda sem esperar que peçam.
73. Seja paciente com alguém que está tendo um dia difícil.
74. Escolha responder com gentileza em uma situação irritante.
75. Evite uma discussão que não levará a nada.
76. Peça desculpas por algo específico, se for apropriado.
77. Procure reconciliar uma pequena pendência.
78. Faça algo bom por alguém sem contar que foi você.
79. Dê atenção a alguém que normalmente passa despercebido.
80. Pergunte a alguém como você pode ajudar.
`,
  },
  {
    tag: 'reflexao_espiritual',
    tipoBias: 'reflexao',
    raw: `
81. Reserve cinco minutos para ficar em silêncio e refletir.
82. Pergunte a si mesmo o que precisa entregar a Deus hoje.
83. Pense em uma área da sua vida em que precisa de sabedoria.
84. Reflita sobre uma atitude sua que gostaria de melhorar.
85. Pense em alguém que precisa do seu perdão.
86. Pense em alguém para quem você precisa pedir perdão.
87. Reflita sobre como suas palavras afetam as pessoas.
88. Pense em uma atitude de amor que você pode praticar hoje.
89. Reflita sobre uma preocupação que você precisa colocar em oração.
90. Pense em uma situação em que poderia ter demonstrado mais paciência.
91. Escolha uma atitude que represente aquilo em que você acredita.
92. Reflita sobre uma pequena mudança que faria bem à sua vida.
93. Antes de dormir, pense em como você tratou as pessoas hoje.
94. Escolha uma palavra para guiar seu comportamento amanhã.
95. Escreva uma frase de esperança para lembrar durante o dia.
96. Releia um versículo que marcou algum momento da sua vida.
97. Compartilhe um versículo que possa trazer esperança a alguém. 📱
98. Mande uma mensagem dizendo a alguém que você está orando por ela. 📱
99. Termine o dia com uma oração de gratidão.
100. Antes de dormir, leia o Salmo 23 e reflita por dois minutos.
`,
  },
];

// ---------------------------------------------------------------------------
// Heurísticas de classificação (tipo/nivel/horário/tempo/tags/momento/dia/contexto)
// vivem agora em scripts/challengeHeuristics.js (compartilhado com o gerador da
// expansão contextual) — nenhum desses campos é usado para filtrar candidatos de
// forma crítica no motor além do que já é intencional (ver src/engine/scoring.ts
// e src/engine/dayModel.ts); o texto do desafio em si (título) é sempre
// reproduzido verbatim da base oficial.
// ---------------------------------------------------------------------------

const { normalize } = heuristics;

// ---------------------------------------------------------------------------
// Classificação dos desafios 📱 em 4 tipos de ação — filosofia: a rede social é
// ferramenta pra fazer algo bom (conectar/reconhecer/incentivar), não um vício
// a reduzir a qualquer custo (esse é só o "usar_melhor"). Classificado à mão
// pelos 33 títulos atuais da base oficial; heurística por palavra-chave serve
// de fallback caso a base mude.
// ---------------------------------------------------------------------------

const SOCIAL_ACTION_TYPE_BY_TITLE = {
  'Indique um pequeno negócio local.': 'incentivar',
  'Deixe uma avaliação positiva quando o serviço merecer.': 'reconhecer',
  'Agradeça publicamente alguém que fez um bom trabalho.': 'reconhecer',
  'Compartilhe um recurso gratuito com alguém.': 'incentivar',
  'Envie uma oportunidade de trabalho para alguém adequado.': 'incentivar',
  'Indique um profissional competente.': 'incentivar',
  'Envie uma mensagem de apoio para alguém.': 'conectar',
  'Evite compartilhar uma notícia sem verificar.': 'usar_melhor',
  'Corrija uma informação falsa com respeito.': 'usar_melhor',
  'Reconheça publicamente uma boa atitude.': 'reconhecer',
  'Compartilhe a conquista de outra pessoa.': 'reconhecer',
  'Faça uma recomendação profissional para alguém.': 'incentivar',
  'Compartilhe uma informação que pode facilitar o dia de alguém.': 'incentivar',
  'Deixe uma avaliação positiva para alguém que merece.': 'reconhecer',
  'Recomende alguém para uma oportunidade.': 'incentivar',
  'Compartilhe uma habilidade gratuitamente.': 'incentivar',
  'Compartilhe com alguém algo pelo qual você é grato.': 'conectar',
  'Mande uma mensagem agradecendo alguém que fez diferença na sua vida.': 'conectar',
  'Envie uma mensagem de esperança para alguém.': 'conectar',
  'Incentive alguém que esteja desanimado.': 'incentivar',
  'Compartilhe uma palavra de esperança com alguém.': 'conectar',
  'Reconheça publicamente uma atitude boa de alguém.': 'reconhecer',
  'Compartilhe um versículo que possa trazer esperança a alguém.': 'conectar',
  'Mande uma mensagem dizendo a alguém que você está orando por ela.': 'conectar',
  'Envie uma foto do seu dia para alguém da família.': 'conectar',
  'Compartilhe uma pequena conquista com sua família.': 'conectar',
  'Beba água antes de abrir uma rede social.': 'usar_melhor',
  'Compartilhe uma descoberta interessante com alguém.': 'conectar',
  'Conte para alguém uma coisa nova que aprendeu hoje.': 'conectar',
  'Recomende o trabalho de alguém.': 'incentivar',
  'Indique um pequeno negócio de alguém conhecido.': 'incentivar',
  'Compartilhe uma oportunidade com alguém.': 'incentivar',
  'Comemore a vitória de outra pessoa.': 'reconhecer',
};

const USAR_MELHOR_HINTS = ['antes de abrir', 'evite compartilhar', 'corrija uma informacao'];
const RECONHECER_HINTS = ['avaliacao positiva', 'agradeca publicamente', 'reconheca publicamente', 'comemore a vitoria', 'compartilhe a conquista'];
const INCENTIVAR_HINTS = ['indique', 'recomende', 'envie uma oportunidade', 'compartilhe uma oportunidade', 'compartilhe um recurso', 'compartilhe uma habilidade', 'faca uma recomendacao', 'incentive'];

function inferSocialActionType(titulo) {
  if (SOCIAL_ACTION_TYPE_BY_TITLE[titulo]) return SOCIAL_ACTION_TYPE_BY_TITLE[titulo];
  const norm = normalize(titulo);
  if (USAR_MELHOR_HINTS.some((h) => norm.includes(normalize(h)))) return 'usar_melhor';
  if (RECONHECER_HINTS.some((h) => norm.includes(normalize(h)))) return 'reconhecer';
  if (INCENTIVAR_HINTS.some((h) => norm.includes(normalize(h)))) return 'incentivar';
  return 'conectar'; // fallback — mensagens/compartilhamentos pessoais diretos
}

function buildChallenge(categoria, prefix, index, rawLine, tipoBias, extraTag) {
  const challenge = heuristics.buildChallenge(categoria, prefix, index, rawLine, tipoBias, extraTag);
  if (challenge.socialContext) {
    challenge.socialActionType = inferSocialActionType(challenge.titulo);
  }
  return challenge;
}

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

const SIMPLE_CATEGORIES = [
  { categoria: 'desenvolvimento_pessoal', prefix: 'dev', file: 'development.ts', varName: 'developmentChallenges', raw: DEVELOPMENT_RAW },
  { categoria: 'relacionamentos', prefix: 'rel', file: 'relationships.ts', varName: 'relationshipsChallenges', raw: RELATIONSHIPS_RAW },
  { categoria: 'familia_presenca', prefix: 'fam', file: 'family.ts', varName: 'familyChallenges', raw: FAMILY_RAW },
  { categoria: 'trabalho_produtividade', prefix: 'trab', file: 'work.ts', varName: 'workChallenges', raw: WORK_RAW },
  { categoria: 'saude_energia', prefix: 'saude', file: 'health.ts', varName: 'healthChallenges', raw: HEALTH_RAW },
  { categoria: 'financas_consumo', prefix: 'fin', file: 'finance.ts', varName: 'financeChallenges', raw: FINANCE_RAW },
  { categoria: 'aprendizado_curiosidade', prefix: 'apr', file: 'learning.ts', varName: 'learningChallenges', raw: LEARNING_RAW },
  { categoria: 'bondade_comunidade', prefix: 'bond', file: 'community.ts', varName: 'communityChallenges', raw: COMMUNITY_RAW },
];

for (const cat of SIMPLE_CATEGORIES) {
  const lines = parseLines(cat.raw);
  if (lines.length !== 100) {
    throw new Error(`${cat.file}: esperado 100 linhas, encontrado ${lines.length}`);
  }
  const challenges = lines.map((line, i) => buildChallenge(cat.categoria, cat.prefix, i + 1, line));

  // Desafio especial de aniversário — só entra na seleção via injeção direta no ChallengeEngine.
  if (cat.categoria === 'desenvolvimento_pessoal') {
    challenges.push({
      id: 'dev_101',
      categoria: 'desenvolvimento_pessoal',
      titulo: 'Celebre seu aniversário 🎂',
      descricao: 'Hoje é o seu dia! Reserve um momento pra celebrar até aqui e pensar no que você quer para o próximo ano.',
      tempoEstimado: 5,
      nivel: 'facil',
      tipo: 'reflexao',
      horariosIdeais: ['qualquer'],
      diasIdeais: 'qualquer',
      tags: ['aniversario', 'celebracao'],
      momentos: ['qualquer'],
      tiposDia: ['qualquer'],
      contexto: ['qualquer'],
      cooldownDias: 365,
    });
  }

  writeFile(cat.file, cat.varName, challenges);
}

// Fé e espiritualidade — categoria com subseções.
let faithIndex = 1;
const faithChallenges = [];
for (const section of FAITH_SECTIONS) {
  const lines = parseLines(section.raw);
  for (const line of lines) {
    faithChallenges.push(buildChallenge('fe_espiritualidade', 'fe', faithIndex, line, section.tipoBias, section.tag));
    faithIndex += 1;
  }
}
if (faithChallenges.length !== 100) {
  throw new Error(`faith.ts: esperado 100 linhas, encontrado ${faithChallenges.length}`);
}
writeFile('faith.ts', 'faithChallenges', faithChallenges);

console.log('Concluído.');

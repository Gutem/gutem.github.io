# O formato PE

[O formato PE](#o-formato-pe-1)  
[Cabeçalho e Stub do DOS](#cabeçalho-e-stub-do-dos)  
[Cabeçalho do arquivo](#cabeçalho-do-arquivo)  
[Cabeçalho opcional](#cabeçalho-opcional)  
[Diretório de dados](#diretório-de-dados)  
[Cabeçalho das seções](#cabeçalho-das-seções)  
[Seções](#seções)  
[Referências](#referências)

###### Nível avançado

O que é que contém estes arquivos de sobrenome .exe que, a um duplo clique do mouse, rodam e efetuam tarefas pre-programadas? Se você não sabe, não se preocupe. A maioria dos programadores, mesmo os bons, também não têm a mínima idéia. Para a maioria dos mortais, um executável não passa de uma sopa de letrinhas que de alguma forma misteriosa acaba fazendo o que se espera dele - beeemmm... quase sempre

Qualquer executável win32 (exceto VxD e DLLs de 16 bits) usa o formato PE de arquivo, ou seja, obedecem a um padrão de armazenamento. É por isso que é interessante conhecê-lo em detalhes. Vamos dar uma olhada como o pequeno executável do tutorial "Janelas" é armazenado em disco. Este tutorial faz parte do "Assembly Numaboa" e você pode fazer o download de tutNB03.zip e usar o tutNB03.exe como exemplo. Usei o mesmo executável como exemplo neste tutorial.

### O formato PE

Imagine o formato PE como sendo simplesmente um padrão de armazenamento de dados que o Windows entenda. São regras para guardar "cada coisa em seu lugar" de modo que o sistema possa achá-las quando necessário. Os programas possuem código, dados inicializados, dados não inicializados, etc, etc, etc. Tudo deve ser guardado de acordo com o modelo estabelecido e o resultado é uma imensa fileira de bytes. O objetivo deste tutorial é ir desvendando cada pedaço dessa tripa de bytes.

PE vem de Portable Executable e é um formato de binários executáveis (DLLs e programas) para windows NT, windows 9x e win32s. Também pode ser utilizado para arquivos de objetos e bibliotecas (libraries).

Este formato foi projetado pela Microsoft e padronizado pelo Comitê do TIS (tool interface standart) - Microsoft, Intel, Borland, Watcom, IBM e outros - em 1993. Aparentemente foi baseado no COFF, o "common object file format", usado para arquivos de objetos e executáveis nos vários sabores UNIX e no VMS.

O SDK do win32 inclui um arquivo header que contém os #defines e typedefs para o formato PE. Estes serão mencionados no decorrer do texto.

A DLL "imagehelp.dll" também poderá ser útil. Ela faz parte do windows NT, porém a documentação é escassa. Algumas de suas funções são descritas no "Developer Network".

### Layout geral do formato PE
| :empty              |
|:-------------------:|
| Cabeçalho MZ do DOS |
| Fragmento (stub) do DOS |
| Cabeçalho do Arquivo |
| Cabeçalho OpcionalDiretório de Dados |
| Cabeçalhos das Seções |
| Seção 1 |
| Seção 2 |
| ... |
| Seção n |

Logo no início de qualquer arquivo no formato PE encontra-se o cabeçalho MZ do DOS seguido por um fragmento (stub) executável MS-DOS. Este stub transforma qualquer arquivo PE num executável MS-DOS válido (apesar disto o tio Bill insiste em afirmar que o windows "baniu" o DOS).

Depois do stub do DOS existe uma assinatura de 32 bits contendo o número mágico (magic number - é assim mesmo que o pessoal o batizou) de valor 00004550h e identificado como IMAGE_NT_SIGNATURE.

A seguir vem o cabeçalho do arquivo (file header) no formato COFF, que indica em qual máquina o executável deve rodar, o número de seções que contém, a hora em que foi linkado, se é um executável ou uma DLL e assim por diante. (Neste contexto, a diferença entre um executável e uma DLL é a seguinte: uma DLL não pode ser iniciada, somente pode ser utilizada por outro binário e um binário não pode ser linkado a um executável).

Depois do cabeçalho do arquivo vem um cabeçalho opcional ("optional header"). Está sempre presente mas, mesmo assim, é chamado de opcional. É que o COFF utiliza um cabeçalho para bibliotecas, mas não para objetos, que é chamado de opcional. Este cabeçalho indica mais alguns detalhes de como o binário deve ser carregado: o endereço inicial, a quantidade reservada para a pilha (stack), o tamanho do segmento de dados, etc.

Uma parte interessante do cabeçalho opcional é o array indicativo dos diretórios de dados (data directories). Estes diretórios contêm ponteiros para dados residentes nas seções (sections). Se, por exemplo, um binário tiver um diretório de exportação (export directory), existe um ponteiro para este diretório no array, sob a denominação IMAGE_DIRECTORY_ENTRY_EXPORT, que apontará para uma das seções.

Após os cabeçalhos ficam as seções, precedidas pelos cabeçalhos de seções (section headers). Em última análise, o conteúdo das seções é o que realmente é necessário para executar um programa e todos os cabeçalhos e diretórios servem apenas para localizar este conteúdo.

Cada seção possui algumas flags sobre alinhamento, o tipo de dados que contém, se pode ser compartilhada, etc, além dos dados propriamente ditos. A maioria das seções, mas não todas, contêm um ou mais diretórios referenciados através de entradas no array diretório de dados (data directory) do cabeçalho opcional. É o caso do diretório de funções exportadas ou do diretório de base de remanejamento (base relocations). Tipos de conteúdo sem diretório são, por exemplo, código executável ou dados inicializados.

A coisa já complicou? Está querendo desistir por aqui? Não se apavore. Cada um dos tópicos será explicado em detalhes e, se você tiver noções de assembly, vai ter muita coisa boa com que se divertir...

Logo no início de qualquer arquivo no formato PE encontra-se o cabeçalho MZ do DOS seguido por um fragmento (stub) executável MS-DOS. Parece brincadeira, mas não é: o stub é um executável DOS completo dentro do executável win32. O stub pode simplesmente mostrar uma string do tipo "This program cannot be run in DOS mode" ou ser um programa DOS completo. Dependendo da vontade do programador, muita coisa pode rolar antes que o executável win32 comece a ser executado.

Stub significa fragmento. O conceito de fragmento do DOS vem desde o tempo dos executáveis de 16 bits do windows (os quais usam o formato NE). O mesmo fragmento é usado em executáveis OS/2, arquivos "self-extracting" e outros aplicativos de 32 bits. Para arquivos PE, o fragmento é um executável compatível com o MS-DOS 2.0, quase sempre constituído por cerca de 100 bytes, cuja função é dar mensagens de erro do tipo "este programa precisa do windows...".

### Cabeçalho MZ do DOS
| :empty              |
|:-------------------:|
| Cabeçalho MZ do DOS |
| Fragmento (stub) do DOS |
| Cabeçalho do Arquivo |
| Cabeçalho OpcionalDiretório de Dados |
| Cabeçalhos das Seções |
| Seção 1 |
| Seção 2 |
| ... |
| Seção n |

Os primeiros dois bytes de qualquer executável em formato PE constituem a assinatura do DOS. Você sabe que dois bytes formam uma palavra (WORD). O word da assinatura SEMPRE é a sequência "MZ", ou seja, 4D 5A em hexadecimal. Portanto, pode-se reconhecer o fragmento do DOS pela sua assinatura. Este reconhecimento é chamado de validação do cabeçalho DOS.

Se abrirmos nosso executável exemplo (o tutNB03.exe) - ou qualquer outro executável no formato PE - num editor hexadecimal, os primeiros 32 bytes serão os seguintes:

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  | ASCII           |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---------------:|
| 0000&nbsp;0000 | 4D | 5A | 90 | 00 | 03 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | FF | FF | 00 | 00 | MZ..........ÿÿ..|
| 0000&nbsp;0010 | B8 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | ¸.......@.......|

Agora dê uma olhada nos bytes das posições 18 a 1B, marcados em verde. 4 bytes são 2 word, e 2 word são um DWORD. Lemos 40 00 00 00. Acontece que os processadores Intel (e compatíveis) guardam os bytes em ordem inversa. Então, lendo da direita para a esquerda, o valor encontrado é 0000 0040. Este valor indica o quanto devemos nos deslocar (offset) para encontrar o stub do DOS.

### Fragmento (stub) do DOS

Seguindo a primeira pista, encontramos o executável DOS. A área destacada em azul é o stub do DOS. Uma parte dos valores tem o correspondente em ASCII de "This program cannot be run in DOS mode", que é a string que será mostrada caso se tente executar este programa a partir do DOS. Geralmente o código usa o serviço 9 da interrupção 21 do DOS para imprimir uma string e o serviço 4C da interrupção 21 para voltar ao ambiente DOS. A instrução de interrupção é CD 21 e as instruções estão destacadas em azul mais claro.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  | ASCII           |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---------------:|
| 0000&nbsp;0000 | 4D | 5A | 90 | 00 | 03 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | FF | FF | 00 | 00 | MZ..........ÿÿ..|
| 0000&nbsp;0010 | B8 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | ¸.......@.......|
| 0000&nbsp;0020 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | ................|
| 0000&nbsp;0030 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | C0 | 00 | 00 | 00 | ............À...|
| 0000&nbsp;0040 | 0E | 1F | BA | 0E | 00 | B4 | 09 | CD | 21 | B8 | 01 | 4C | CD | 21 | 54 | 68 | ..º..´.Í!Th     |
| 0000&nbsp;0050 | 69 | 73 | 20 | 70 | 72 | 6F | 67 | 72 | 61 | 6D | 20 | 63 | 61 | 6E | 6E | 6F | is program canno|
| 0000&nbsp;0060 | 74 | 20 | 62 | 65 | 20 | 72 | 75 | 6E | 20 | 69 | 6E | 20 | 44 | 4F | 53 | 20 | t be run in DOS |
| 0000&nbsp;0070 | 6D | 6F | 64 | 65 | 2E | 0D | 0D | 0A | 24 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | mode....$.......|

No offset 3C encontra-se a segunda pista: C0 00 00 00. Já sabemos que corresponde a 0000 00C0. É onde se encontra a assinatura PE.

#### A assinatura PE

Seguindo a segunda pista, encontramos a assinatura PE que indica o início do cabeçalho do arquivo. Pressupõem-se que todo arquivo que contenha uma assinatura PE seja um arquivo PE válido - pelo menos o Windows "pensa" assim.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  | ASCII           |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---------------:|
| 0000&nbsp;0000 | 4D | 5A | 90 | 00 | 03 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | FF | FF | 00 | 00 | MZ..........ÿÿ..|
| 0000&nbsp;0010 | B8 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | ¸.......@.......|
| 0000&nbsp;0020 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | ................|
| 0000&nbsp;0030 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | C0 | 00 | 00 | 00 | ............À...|
| 0000&nbsp;0040 | 0E | 1F | BA | 0E | 00 | B4 | 09 | CD | 21 | B8 | 01 | 4C | CD | 21 | 54 | 68 | ..º..´.Í!Th     |
| 0000&nbsp;0050 | 69 | 73 | 20 | 70 | 72 | 6F | 67 | 72 | 61 | 6D | 20 | 63 | 61 | 6E | 6E | 6F | is program canno|
| 0000&nbsp;0060 | 74 | 20 | 62 | 65 | 20 | 72 | 75 | 6E | 20 | 69 | 6E | 20 | 44 | 4F | 53 | 20 | t be run in DOS |
| 0000&nbsp;0070 | 6D | 6F | 64 | 65 | 2E | 0D | 0D | 0A | 24 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | mode....$.......|
| 0000&nbsp;0080 | E3 | E2 | 11 | DB | A7 | 83 | 7F | 88 | A7 | 83 | 7F | 88 | A7 | 83 | 7F | 88 | ãâ.Û§ƒ.ˆ§ƒ.ˆ§ƒ.ˆ|
| 0000&nbsp;0090 | A7 | 83 | 7F | 88 | B4 | 83 | 7f | 88 | 5B | A3 | 6D | 88 | A6 | 83 | 7F | 88 | §ƒ.ˆ´ƒ.ˆ[£mˆ¦ƒ.ˆ|
| 0000&nbsp;00A0 | 60 | 85 | 79 | 88 | A6 | 83 | 7F | 88 | 52 | 69 | 63 | 68 | A7 | 83 | 7F | 88 | `…yˆ¦ƒ.ˆRich§ƒ.ˆ|
| 0000&nbsp;00B0 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | ................|
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 03 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 | PE..L...yxU<....|

Para tirar a cisma, vamos usar nosso visualizador on line para dar uma olhada num executável que é um velho conhecido: o bloco de notas (notepad.exe). O visualizador é um objeto flash. Caso seu browser não esteja habilitado para rodar flash, habilite-o. Se você não tiver o plugin do flash instalado, faça o download na Macromedia.

Como dito acima, os primeiros dois bytes correspondem à assinatura do DOS. Os valores 4D e 5A são "M" e "Z" em ASCII. Os bytes seguintes, até o offset 78, compõem o stub.

1. Clique na linha 0000 0000, espere os bytes correspondentes entrarem e mova o cursor do mouse sobre o conteúdo: os words 4D e 5A são transformados nos ASCII correspondentes.
O que nos interessa particularmente é o DWORD no offset 3C. Este campo nos indica a posição da assinatura do PE. Encontramos os bytes 80 00 00 00 que, anotados no sentido inverso, indicam um offset de 0000 0080. É onde se encontra a assinatura PE.

2. Clique na linha 0000 0030, espere os bytes correspondentes entrarem e mova o cursor do mouse sobre o conteúdo. Aguarde enquanto os bytes do offset 3C são invertidos e o offset correspondente é destacado. Se você clicar na linha indicada, a 0000 0080, entram novamente os bytes correspondentes e, movendo o cursor sobre o conteúdo, os bytes 50 e 45 são transformados nos ASCII correspondentes "P" e "E".

É evidente que a mensagem que o DOS dá em caso de incompatibilidade precisa estar dentro do fragmento do DOS. Se você tiver curiosidade, siga o passo 3:

3. Clique sobre a linha 0000 0040 (também na 50, 60 e 70 se você quiser), espere os bytes entrarem e descanse o cursor sobre eles. Os valores hexadecimais serão transformados nos ASCII da mensagem.

#### Exercícios propostos

Se você for iniciante no assunto e estiver lendo este texto para aprender, então sugiro que não tenha pressa. O assunto é longo, os conceitos precisam ser bem entendidos e as informações precisam de tempo para se fixarem. Além disto, a prática só se adquire após algum treinamento. Para cada assunto abordado haverá sempre uma proposta de exercícios.

Para este primeiro módulo, tente o seguinte:

1. Abra um monte de executáveis no seu editor hexa preferido e localize a assinatura PE.

2. Treine inverter os bytes de um valor de 32 bits. Primeiro use lápis papel, depois tente inverter "de cabeça".

### Cabeçalho do arquivo

| :empty              |
|:-------------------:|
| Cabeçalho MZ do DOS |
| Fragmento (stub) do DOS |
| Cabeçalho do Arquivo |
| Cabeçalho OpcionalDiretório de Dados |
| Cabeçalhos das Seções |
| Seção 1 |
| Seção 2 |
| ... |
| Seção n |

Para obter o IMAGE_FILE_HEADER é preciso validar o "MZ" do cabeçalho do DOS (os primeiros 2 bytes), depois encontrar o membro 'e_lfanew' do cabeçalho do fragmento do DOS (offset 3C) e avançar o número indicado de bytes a partir do início do arquivo. Resumindo: na posição 003C encontra-se o 'e_lfanew' cujo valor, de 32 bits, nos indica a posição do início do cabeçalho do arquivo, ou seja, a IMAGE_NT_SIGNATURE, cujo valor é sempre 00004550 (veja na página anterior se tiver dúvidas).

Os componentes do cabeçalho do arquivo são os seguintes:

* Assinatura do cabeçalho PE
* Tipo de máquina previsto para rodar o executável
* Número de seções
* TimeDateStamp
* Ponteiro para Tabela de Símbolos e Número de Símbolos
* Tamanho do Cabeçalho Opcional
* Características

#### Assinatura PE e tipo de máquina

O cabeçalho do arquivo, uma estrutura do tipo IMAGE_FILE_HEADER, tem como primeiro componente a assinatura PE e, logo a seguir, um dos seguintes elementos:

| Nome                       | #define em hexa | Significado                         |
|:--------------------------:|:---------------:|:-----------------------------------:| 
| IMAGE_FILE_MACHINE_I386    | 014C            | processador Intel 80386 ou melhor   |
|                            | 014D            | processador Intel 80486 ou melhor   |
|                            | 014E            | processador Intel Pentium ou melhor |
|                            | 0160            | E3000 (MIPS), big endian            |
| IMAGE_FILE_MACHINE_R3000   | 0162            | R3000 (MIPS), little endian         |
| IMAGE_FILE_MACHINE_R4000   | 0166            | R4000 (MIPS), little endian         |
| IMAGE_FILE_MACHINE_R10000  | 0168            | R10000 (MIPS), little endian        |
| IMAGE_FILE_MACHINE_ALPHA   | 0184            | DEC Alpha AXP                       |
| IMAGE_FILE_MACHINE_POWERPC | 01F0            | IBM Power PC, little endian         |

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 |    |    |    |    |    |    |    |    |    |    |

No nosso exemplo ficou determinado que a assinatura PE se encontra no offset 00C0, ocupando 4 bytes. Os dois bytes seguintes, nas posições 00C4 e 00C5, indicam que o executável foi previsto para rodar num processador Intel 80386 ou melhor: IMAGE_FILE_MACHINE_I386 de valor 014C (não esqueça de inverter os bytes, conforme explicado anteriormente).

#### Número de seções

O terceiro componente do cabeçalho do arquivo é um valor de 16 bits que indica o número de seções após o cabeçalho. As seções serão discutidas em detalhe adiante. No nosso exemplo, são 4 (04 00 invertido = 00 04).

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 |    |    |    |    |    |    |    |    |

#### Carimbo de data e hora

Logo após o número de seções encontra-se um valor de 32 bits, o "TimeDateStamp" (carimbo de data e hora), referente ao momento da criação do arquivo. Pode-se distinguir as diversas versões de um mesmo arquivo através deste valor, mesmo que o valor "oficial" da versão não tenha sido alterado. O formato deste carimbo não está documentado, exceto de que deveria ser único entre as versões do mesmo arquivo. Aparentemente corresponde ao número de segundos decorridos a partir de 1 de Janeiro de 1970 00:00:00, em UTC - o formato utilizado pela maioria dos compiladores C para time_t. Este carimbo é utilizado para a união de diretórios de importação, os quais serão abordados adiante.

alguns linkers costumam atribuir valores absurdos ao carimbo, fora dos padrões time_t descritos acima.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C |    |    |    |    |

Invertendo os bytes, o TimeDateStamp do nosso executável exemplo mostra um valor hexadecimal de 3C55 77A3 que corresponde a 1.012.234.147 decimal. Sabendo que este valor é o número de segundos decorridos a partir de 01.01.70 e que cada dia possui 86.400 segundos, podemos calcular que o binário em questão foi criado 11.716 dias (um pouquinho menos) após o início de 1970. Isto corresponde a mais ou menos 32 anos ... UAU! O executável foi criado no ano de 2002 (1970 + 32). Realmente, se você observar a data do arquivo exemplo (o tutNB03.exe), verá que o executável foi criado em 28 de Janeiro de 2002 às 14:12 horas.

#### PointerToSymbolTable e NumberOfSymbols

Os componentes "PointerToSymbolTable" (ponteiro para a tabela de símbolos) e "NumberOfSymbols" (número de símbolos), ambos de 32 bits, são utilizados para fins de debug. Não sei como decifrá-los e, geralmente, estão zerados.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 |    |    |    |    |    |    |    |    |    |    |    |    | 

#### SizeOfOptionalHeader

O "SizeOfOptionalHeader" (tamanho do cabeçalho opcional), de 16 bits, é simplesmente o tamanho do IMAGE_OPTIONAL_HEADER. Pode ser utilizado para verificar se a estrutura do arquivo PE está correta. No nosso exemplo, o tamanho do cabeçalho opcional é 224 (E000 invertido = 00E0 hexa = 224 decimal).

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 |    |    |    |    |    |    |    |    |    |    |

#### Características

"Characteristics" (características) tem 16 bits e consiste num conjunto de flags, a maioria válida apenas para arquivos objeto e bibliotecas:

| Bit | Nome | Setado (valor 1) |
|:---:|:----:|:----------------:|
| 0 | IMAGE_FILE_RELOCS_STRIPPED | Se não houver informações de remanejamento no arquivo. Isto se refere a informações de remanejamento por seção nas próprias seções. Não é utilizado em executáveis, os quais possuem informações de remanejamento no diretório "base relocation" descrito abaixo. |
| 1 | IMAGE_FILE_EXECUTABLE_IMAGE | Se o arquivo for um executável, isto é, não é nem um arquivo objeto nem uma biblioteca. Esta flag também pode estar setada se a tentativa do linker em criar um executável tenha falhado por algum motivo - a imagem é mantida para facilitar uma linkagem incremental numa próxima tentativa. |
| 2 | IMAGE_FILE_LINE_NUMS_STRIPPED | Se a informação do número de linha tiver sido eliminada. Não é usado em executáveis. |
| 3 | IMAGE_FILE_LOCAL_SYMS_STRIPPED | Se não houver informação sobre símbolos locais. Não é usado em executáveis. |
| 4 | IMAGE_FILE_AGGRESIVE_WS_TRIM | Se o sistema operacional deve cortar agressivamente o conjunto de trabalho do processo em andamento (a quantidade de RAM que o processo utiliza) através de um 'paging out'. Este bit deve ser setado apenas em aplicativos tipo demon que, na maior parte do tempo, ficam em estado de espera. |
| 7 | IMAGE_FILE_BYTES_REVERSED_LO | Assim como seu par, o bit 15, está setado se o endian do arquivo não corresponder ao esperado pela máquina, de modo que precisa haver uma troca de bytes antes que uma leitura seja efetuada. Esta flag não é confiável para arquivos executáveis - o sistema operacional conta com os bytes devidamente ordenados nos executáveis. |
| 8 | IMAGE_FILE_32BIT_MACHINE | Se for para rodar numa máquina de 32 bits. |
| 9 | IMAGE_FILE_DEBUG_STRIPPED | Se não houver informação de debug no arquivo. Não é utilizado para executáveis. De acordo com outras informações ([6]), este bit é denominado de "fixo" e é setado se a imagem só puder rodar se estiver mapeada no endereço preferido (ou seja, não permite remanejamento). |
| 10 | IMAGE_FILE_REMOVABLE_RUN_FROM_SWAP | Se o aplicativo não puder rodar a partir de um meio removível, como um disquete ou CD-ROM. Neste caso, o sistema operacional é informado para copiar o arquivo para um arquivo temporário ("swapfile") e executá-lo a partir da cópia. |
| 11 | IMAGE_FILE_NET_RUN_FROM_SWAP | Se o aplicativo não puder ser executado em rede. Neste caso, o sistema operacional é informado para copiar o arquivo para um arquivo temporário local ("swapfile") e executá-lo a partir da cópia. |
| 12 | IMAGE_FILE_SYSTEM | Se o arquivo for um arquivo de sistema, por exemplo, um driver. Não é utilizado em executáveis. Também não é usado em todos os drivers NT. |
| 13 | IMAGE_FILE_DLL | Se o arquivo for uma DLL. |
| 14 | IMAGE_FILE_UP_SYSTEM_ONLY | Se o arquivo não tiver sido projetado para rodar em sistemas multiprocessados, ou seja, travará porque depende, de algum modo, de um único processador. |
| 15 | IMAGE_FILE_BYTES_REVERSED_HI | Veja Bit 7. |

Agora a coisa complicou um pouquinho. Precisamos "abrir" o hexadecimal de 16 bits destacado em rosa para sua notação binária e analisar cada um dos bits:

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 |    |    |    |    |    |    |    |    |

Transformando os valores hexadecimais em binários, temos o que precisamos. Observe que tanto os bytes quanto a numeração dos bits, para variar, precisa ser considerada no sentido inverso.

| Hexa    | 01 | 0F |
|:-------:|:--:|:--:|
| Binário | 0 0 0 0 0 0 0 1 | 0 0 0 0 1 1 1 1 |
| Bits    | 15 14 13 12 11 10 9 8 | 7 6 5 4 3 2 1 0 |

Agora, de posse dos bits, podemos analisar a informação transmitida por cada um deles:

| bit | binário | característica                       |
|:---:|:-------:|:------------------------------------:|
| 0   | 1       | Há informações de remanejamento      |
| 1|  | 1       | É um arquivo executável              |
| 2   | 1       | A numeração de linhas foi eliminada  |
| 3   | 1       | Há informações sobre símbolos locais |
| 4   | 0       |                                      |
| 5   | 0       |                                      |
| 6   | 0       |                                      |
| 7   | 0       | O endian corresponde                 |
| 8   | 1       | É para rodar numa máquina de 32 bits |
| 9   | 0       |                                      |
| 10  | 0       |                                      |
| 11  | 0       |                                      |
| 12  | 0       |                                      |
| 13  | 0       |                                      |
| 14  | 0       |                                      |
| 15  | 0       | O endian corresponde                 |

#### Algumas considerações sobre RVA

RVA é o endereço virtual relativo. O formato PE faz uso intensivo dos assim chamados RVAs. Um RVA ("relative virtual address") é utilizado para definir um endereço de MEMÓRIA caso se desconheça o endereço base ("base address"). É o valor que, adicionado ao endereço base, fornece o endereço linear.

O endereço base é o endereço a partir do qual a imagem PE é carregada na memória e pode mudar de uma execução para outra. Por exemplo, rodando duas instâncias de um mesmo executável, cada um deles terá um endereço base diferente, ou seja, foram mapeados para localizações diferentes na memória. Outro exemplo: imagine um executável mapeado para o endereço 0x400000 e que a execução se inicie no RVA 0x1560. O endereço de memória que contém o início efetivo será 0x401560. Se o executável tivesse sido mapeado a partir de 0x100000, o início de execução estaria em 0x101560.

As coisas começam a ficar um pouco mais complexas porque algumas partes do arquivo PE (as seções) não estão necessariamente alinhadas da mesma forma que a imagem mapeada. Por exemplo, as seções do arquivo em disco geralmente estão alinhadas em limites de 512 bytes, enquanto que a imagem mapeada na memória provavelmente esteja alinhada em limites de 4096 bytes. Veja 'SectionAlignment' e 'FileAlignment' adiante.

Deste modo, para localizar um bloco de informações num arquivo PE para um RVA específico, há a necessidade de se calcular os deslocamentos (offsets) como se o arquivo estivesse mapeado, porém saltar de acordo com os deslocamentos do arquivo. Como exemplo, suponha que você saiba que a execução se inicia no RVA 0x1560 e pretende desassemblar o código a partir deste ponto. Para achar o endereço no arquivo (disco), você precisará descobrir que as seções na RAM estão alinhadas em 4096 bytes, que a seção ".code" começa no RVA 0x1000 da RAM e tem o comprimento de 16384 bytes. Só então você pode determinar que o RVA 0x1560 está deslocado (offset) 0x560 nesta seção. Agora, verificando também que as seções do arquivo em disco estão alinhadas no limite de 512 bytes e que a seção ".code" começa no deslocamento 0x800, com alguns cálculos, torna-se possível localizar o início da execução em disco: 0x800 + 0x560 = 0xD60.

Desassemblando, você encontra uma variável no endereço linear 0x1051D0. O endereço linear será remanejado após o mapeamento do executável e, supostamente, o endereço preferencial será usado. Você consegue determinar que o endereço preferencial é 0x100000, portanto, o RVA é 0x51D0. Isto ocorre na seção de dados que começa no RVA 0x5000 e tem 2048 bytes de comprimento. Ela tem seu início no deslocamento 0x4800 do arquivo em disco, portanto a variável pode ser encontrada no deslocamento 0x4800 + 0x51D0 - 0x5000 = 0x49D0.

#### Exercícios propostos

Para este módulo, tente o seguinte:

1. Continue fuçando os executáveis que você encontrar no seu HD. Qualquer um serve, contanto que esteja no formato PE. Localize o cabeçalho do arquivo e analise principalmente o campo número de seções. Vai ser útil logo adiante.

2. Faça alguns exercícios de transformação de hexa para binário. Se estiver com preguiça, use a calculadora do windows na opção "científica" - as trasnformações estão a um clique de mouse. Caso você queira se aprofundar mais no assunto, dê uma olhada em Sistemas de Notação.

3. Tente desenhar um mapa de memória e um mapa de disco para um executável imaginário. Tente entender o que esse negócio de RVA tem a ver com isso.

### Cabeçalho opcional

| :empty              |
|:-------------------:|
| Cabeçalho MZ do DOS |
| Fragmento (stub) do DOS |
| Cabeçalho do Arquivo |
| Cabeçalho OpcionalDiretório de Dados |
| Cabeçalhos das Seções |
| Seção 1 |
| Seção 2 |
| ... |
| Seção n |

Imediatamente após o cabeçalho do arquivo vem o cabeçalho opcional que, apesar do nome, está sempre presente. Este cabeçalho contém informações de como o arquivo PE deve ser tratado. Os componentes do cabeçalho opcional são os seguintes:

* Magic
* MajorLinkerVersion e MinorLinkerVersion
* Tamanho do Código, Segmento de Dados e Segmento BSS
* AddressOfEntryPoint - O Ponto de Entrada do Código do Executável
* Base do Código e Base dos Dados
* Base da Imagem
* Alinhamento
* Versão do Sistema Operacional
* Versão do Binário
* Versão do Subsistema
* Versão do Win32
* Tamanho da Imagem
* Tamanho dos Cabeçalhos
* CheckSum
* Subsistema NT
* Características de DLL
* Tamanho da Reserva de Pilha (StackReserve)
* Loader Flags
* Número e Tamanho dos RVA

#### Magic

O primeiro word de 16 bits do cabeçalho opcional é o 'Magic'. Em todos os arquivos PE que analisei até hoje, o valor encontrado sempre foi 010B.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 |    |    |    |    |    |    |

#### MajorLinkerVersion e MinorLinkerVersion

O próximo componente do cabeçalho opcional, composto de 2 bytes, reflete as versões Maior e Menor do linker utilizado. Estes valores, novamente, não são confiáveis e nem sempre refletem apropriadamente a versão do linker. Muitos linkers nem mesmo utilizam estes campos. Aliás, se não se tem a mínima idéia de qual linker tenha sido utilizado, qual é a vantagem de conhecer a versão?

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C |    |    |    |    |

#### Tamanho do Código, Segmento de Dados e Segmento BSS

Os 3 valores de 32 bits seguintes referem-se ao Tamanho do Código Executável ('SizeOfCode'), ao Tamanho dos Dados Inicializados ('SizeOfInitializedCode') e ao Tamanho dos Dados não Inicializados ('SizeOfUninitializedCode'). O tamanho dos dados inicializados também é conhecido como Segmento de Dados (Data Segment) e o tamanho dos dados não inicializados é conhecido como Segmento BSS (BSS Segment). Estes dados, uma vez mais, não são confiáveis! Por exemplo: o segmento de dados pode estar dividido em vários segmentos por ação do compilador ou do linker. O melhor que se tem a fazer é inspecionar as seções para ter uma idéia mais aproximada dos tamanhos.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 |    |    |    |    |    |    |    |    |

#### Ponto de entrada do código executável

O próximo valor de 32 bits é um RVA. Se você tiver dúvidas sobre RVAs, NÃO CONTINUE. Volte para a página anterior e leia com atenção as Considerações sobre RVAs. A partir deste ponto, se você não estiver familiarizado com as ditas cujas... vai perder o passo!

Este RVA é o offset para o Ponto de Entrada do Código ('AddressOfEntryPoint'), ou seja, é onde a execução do nosso binário, MAPEADO NA MEMÓRIA, realmente começa.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 |    |    |    |    |

Invertendo os bytes, obtemos o RVA do Endereço do Ponto de Entrada: 00 10 00 00 -> 00 00 10 00. Este valor (1000) é o que será adicionado ao endereço base quando nosso programa for mapeado na MEMÓRIA. Imagine que, ao ser executado, o executável tenha sido mapeado na memória a partir do endereço 40000. Qual será o ponto de entrada do código? Simples: 40000 + 1000 = 41000. Entendeu agora porque o valor deste campo é um RVA?

#### Base do Código e Base dos Dados

Logo após o importantíssimo Ponto de Entrada encontram-se dois valores de 32 bits, o 'BaseOfCode' (base do código) e o 'BaseOfData' (base dos dados), ambos também RVAs. Infelizmente os dois também perdem importância (como tantos outros campos) por que a informação obtida através da análise das seções é muito mais confiável.

Não existe uma base de dados não inicializados porque, por não serem inicializados, não há necessidade de incluir esta informação na imagem.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 |    |    |    |    |    |    |    |    |    |    |    |    |

#### Base da Imagem

Segue uma entrada de um valor de 32 bits que indica o endereço de mapeamento preferencial, chamado de endereço linear e correspondendo à 'BaseImage'. No momento da execução, se este endereço de memória estiver vago, o binário inteiro (incluindo os cabeçalhos) será transferido para lá. Este é o endereço, sempre um múltiplo de 64, para onde o binário é remanejado pelo linker. Se o endereço estiver disponível, o carregador (loader) não precisará remanejar o arquivo, o que representa um ganho no tempo de carregamento.

O endereço preferido de mapeamento não pode ser utilizado se outra imagem já tiver sido mapeada para este endereço (uma colisão de endereços, a qual ocorre com alguma frequência quando se carrega várias DLLs que são remanejadas para o default do linker) ou se a memória em questão estiver sendo usada para outros fins (stack, malloc(), dados não inicializados, etc). Nestes casos, a imagem precisa ser transferida para algum outro endereço (veja 'diretório de remanejamento' logo a seguir). Este fato gera consequências posteriores se a imagem pertencer a uma DLL por que, neste caso, as importações casadas ("bound imports") deixam de ser válidas e há a necessidade de efetuar correções nos binários que utilizam estas DLLs - veja também em 'diretório de remanejamento' a seguir.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 | 00 | 40 | 00 | 00 |    |    |    |    |    |    |    |    |

#### Alinhamento

Os dois valores de 32 bits seguintes são os alinhamentos das seções do arquivo PE na RAM ('SectionAlignment', quando a imagem estiver carregada na memória) e no arquivo em disco ('FileAlignment'). Geralmente ambos valores são 32, ou então FileAlignment (alinhamento de arquivo) é 512 e SectionAlignment (alinhamento de seções) é 4096. As seções serão vistas posteriormente.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 |

No nosso exemplo, o alinhamento de seções é 4096 (0010 0000 -> inverso 0000 1000 -> 4096 decimal) e o alinhamento de arquivo é 512 (0002 0000 -> inverso 0000 0200 -> 512 decimal).

#### Versão do Sistema Operacional

Os dois valores seguintes são de 16 bits e referem-se à versão esperada do sistema operacional ('MajorOperatingSystemVersion' e 'MinorOperatingSystemVersion'). Esta informação da versão é apenas para o sistema operaconal, por exemplo NT ou Win98, ao contrário da versão do sub-sistema, por exemplo Win32. Geralmente esta informação não é fornecida ou está errada. Aparentemente o carregador (loader) não faz uso da mesma, portanto...

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 |
| 0000&nbsp;0100 | 04 | 00 | 00 | 00 |    |    |    |    |    |    |    |    |    |    |    |    |

#### Versão do Binário

Os dois valores de 16 bits seguintes fornecem a versão do binário ('MajorImageVersion' e 'MinorImageVersion'). Muitos linkers não fornecem dados corretos e uma grande parte dos programadores nem se dá ao trabalho de fornecê-los. O melhor é se fiar na versão dos recursos (resource), contanto que exista.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 |
| 0000&nbsp;0100 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |    |    |    |    |    |    |    |    |

#### Versão do Sub-sistema

Os próximos 2 words de 16 bits são para a versão do sub-sistema esperado ('MajorSubsystemVersion' e 'MinorSubsystemVersion'). Esta versão deveria ser Win32 ou POSIX, por que os programas de 16 bits ou os do OS/2 obviamente não estão em formato PE.

Esta versão de subsistema deve ser fornecida corretamente porque ela É checada e usada:

* Se o aplicativo for um do tipo Win32-GUI, tiver que rodar em NT4 e a versão do sub-sistema não for 4.0, as caixas de diálogo não terão o estilo 3D e alguns outros aspectos terão a aparência do "estilo antigo". Isto porque o aplicativo acaba sendo rodado no NT 3.51, o qual possui o program manager ao invés do explorer, etc, e o NT 4.0 tentará imitar o 3.51 da melhor maneira possível.
    
* Idem para Win98 e WinMe. O aplicativo indica Win98 e o sistema da máquina é WinMe, então o WinMe tenta de tudo para imitar o Win98...

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 |
| 0000&nbsp;0100 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |

#### Versão do Win32

Só Deus sabe para é que serve este próximo valor de 32 bits. Está sempre zerado (veja acima).

#### Tamanho da Imagem

Este valor de 32 bits indica a quantidade de memória necessária para abrigar a imagem, em bytes ('SizeOfImage'). É a soma do comprimento de todos os cabeçalhos e seções, se estiverem alinhados de acordo com o 'SectionAlignement'. Indica para o carregador quantas páginas serão necessárias para carregar completamente a imagem.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 |
| 0000&nbsp;0100 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |
| 0000&nbsp;0110 | 00 | 50 | 00 | 00 |    |    |    |    |    |    |    |    |    |    |    |    |

No nosso exemplo, obedecendo o alinhamento de seções de 4096 (veja acima), são requeridos 20.480 bytes para abrigar a imagem do executável na memória. Basta calcular: 0050 0000 -> inverso 0000 5000 -> 20.480 decimal.

#### Tamanho dos Cabeçalhos

O próximo valor de 32 bits é o tamanho de todos os cabeçalhos, incluindo os diretórios de dados e os cabeçalhos das seções ('SizeOfHeaders'). Representa o offset do início do arquivo até os dados (raw data) da primeira seção.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 |
| 0000&nbsp;0100 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |
| 0000&nbsp;0110 | 00 | 50 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | 00 | 00 | 00 |    |    |    |    |

No nosso exemplo, o offset do início do arquivo até os dados propriamente ditos é de 0000 0400 que, em decimal, corresponde a 1024 bytes.

#### CheckSum

Segue-se o valor de 32 bits do 'CheckSum'. O valor do checksum, para as versões atuais do NT, só é checado se a imagem for um driver NT (o driver não carregará se o checksum não estiver correto). Para outros tipos de binários o checksum não precisa ser fornecido e pode ser 0.

O algoritmo para calcular o checksum é propriedade da Microsoft e o pessoal da MS não entrega o ouro. No entanto, diversas ferramentas do Win32 SDK calculam e/ou inserem um checksum válido. Além disto, a função CheckSumMappedFile(), que faz parte da imagehelp.dll, também faz o serviço completo.

A função do checksum é a de evitar que binários "bichados", que vão dar pau de qualquer forma, sejam carregados - e um driver com pau acaba em BSOD, portanto, é melhor nem carregar.

No nosso exemplo, que não é para NT, o valor está zerado (veja acima).

#### Subsistema NT

O próximo valor de 16 bits, o 'Subsystem', indica em qual subsistema do NT a imagem deve rodar:

| Nome                        | Valor | Significado |
|:---------------------------:|:-----:|:-----------:|
| IMAGE_SUBSYSTEM_NATIVE      |   1   | O binário não precisa de um subsistema. É usado para drivers. |
| IMAGE_SUBSYSTEM_WINDOWS_GUI |   2   | A imagem é um binário Win32 gráfico. Ainda pode abrir um console com AllocConsole(), porém não abre automaticamente no startup. |
| IMAGE_SUBSYSTEM_WINDOWS_CUI |   3   | O binário é um Win32 de console. Receberá um console no startup (default) ou herda um console (parent's console). |
| IMAGE_SUBSYSTEM_OS2_CUI     |   5   | O binário é um OS/2 de console. Os binários OS/2 estarão em formato OS/2, portanto, este valor raramente será encontrado num arquivo PE. |
| IMAGE_SUBSYSTEM_POSIX_CUI   |   7   | O binário usa um subsistema de console POSIX. |

Binários do Windows 9x sempre usarão o subsistema Win32, portanto, os únicos valores aceitáveis para estes binários são 2 e 3. Desconheço se binários "nativos" do windows 9x são aceitos.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 |
| 0000&nbsp;0100 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |
| 0000&nbsp;0110 | 00 | 50 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 02 | 00 | 00 | 00 |

#### Características de DLL

Este próximo valor de 16 bits indica quando o ponto de entrada deve ser chamado, SE a imagem for de uma DLL. No nosso exemplo, este valor está logicamente zerado (veja acima). Este é mais um campo que parece não ter uso: aparentemente, as DLL recebem notificações de tudo e prescindem deste campo. Novamente os bits são usados para guardar informações:
Bit|Setado (valor 1)
0|Notifica uma anexação de processo (isto é, DLL load)
1|Notifica um desligamento de thread (isto é, termina um thread ativo)
2|Notifica uma anexação de thread (isto é, cria um thread novo)
3|Notifica um desligamento de processo (isto é, DLL unload)
Tamanho da Reserva de Pilha (StackReserve)

Os próximos 4 valores de 32 bits são o tamanho da reserva de pilha ('SizeOfStackReserve'), o tamanho do commit inicial da pilha ('SizeOfStackCommit'), o tamanho da reserva de heap ('SizeOfHeapReserve') e o tamanho do commit do heap ('SizeOfHeapCommit').

As quantidades 'reservadas' são espaços endereçados (não RAM real) que são reservados para um propósito específico. No início do programa, a quantidade "committada" é alocada na RAM. O valor "committado" é também o quanto a pilha ou o heap "committados" irão crescer caso for necessário. Alguns autores alegam que a pilha cresce em páginas, independentemente do valor do 'SizeOfStackCommit'.

Vamos a um exemplo: se o programa possui uma reserva de heap de 1 MB e um commit de heap de 64 Kb, o heap começa com 64 Kb e pode ser expandido até 1 MB. O heap irá crescer de 64 em 64 Kb. O 'heap' neste contexto é o heap primário (default). Um processo pode criar mais heaps se houver necessidade.

Como as DLLs não possuem pilha ou heap próprios, estes valores são ignorados nas suas imagens.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| 0000&nbsp;00D0 | 00 | 00 | 00 | 00 | E0 | 00 | 0F | 01 | 0B | 01 | 05 | 0C | 00 | 02 | 00 | 00 |
| 0000&nbsp;00E0 | 00 | 0E | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;00F0 | 00 | 20 | 00 | 00 | 00 | 40 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 |
| 0000&nbsp;0100 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |
| 0000&nbsp;0110 | 00 | 50 | 00 | 00 | 00 | 04 | 00 | 00 | 00 | 00 | 00 | 00 | 02 | 00 | 00 | 00 |
| 0000&nbsp;0120 | 00 | 00 | 10 | 00 | 00 | 10 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 10 | 00 | 00 |
| 0000&nbsp;0130 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 |    |    |    |    |    |    |    |    | 

#### Loader Flags

Os próximos 32 bits são das 'LoaderFlags' (flags do carregador) para as quais não há uma descrição adequada. No nosso exemplo, de qualquer maneira, todas as flags estão zeradas (veja acima).
Número e Tamanho dos RVA

O número e tamanho dos RVAs ('NumberOfRvaAndSizes') se encontram nos 32 bits seguintes e revelam o número de entradas válidas nos diretórios que vêm logo a seguir. Este número parece não ser muito confiável. No nosso exemplo, veja também acima, são 16 (1000 0000 -> invertendo 0000 0010 -> 16 decimal).

#### Exercícios propostos

Para este módulo, tente o seguinte:

1. Procure por executáveis de todos os tamanhos. Qualquer um serve, contanto que esteja no formato PE. Localize o cabeçalho opcional dos binários e encontre o ponto de entrada, o importantíssimo ENTRY POINT.

2. Faça alguns exercícios com diversos endereços base de memória e aplique o RVA do ponto de entrada (como explicado no item "Ponto de Entrada do Código do Executável").

### Diretório de dados

| :empty              |
|:-------------------:|
| Cabeçalho MZ do DOS |
| Fragmento (stub) do DOS |
| Cabeçalho do Arquivo |
| Cabeçalho OpcionalDiretório de Dados |
| Cabeçalhos das Seções |
| Seção 1 |
| Seção 2 |
| ... |
| Seção n |

Imediatamente após o cabeçalho opcional vêm os diretórios de dados. Os diretórios são um array de IMAGE_NUMBEROF_DIRECTORY_ENTRIES (16) IMAGE_DATA_DIRECTORY. Cada um destes diretórios descreve a localização (um RVA de 32 bits denominado 'VirtualAddress') e o tamanho (também de 32 bits, chamado 'Size') de uma peça de informação que está localizada em uma das seções que seguem as entradas de diretório.

Por exemplo, o diretório de segurança (security directory) se encontra no RVA e tem o tamanho indicado no índice 4. Os índices definidos para os diretórios são:

| Nome | Índice | Diretório |
|:----:|:------:|:---------:|
| IMAGE_DIRECTORY_ENTRY_EXPORT | 0 | É o diretório de funções exportadas, usado principalmente para DLLs. |
| IMAGE_DIRECTORY_ENTRY_IMPORT | 1 | Diretório de símbolos importados. |
| IMAGE_DIRECTORY_ENTRY_RESOURCE | 2 | Diretório de recursos (resources). |
| IMAGE_DIRECTORY_ENTRY_EXCEPTION | 3 | Diretório de exceções - estrutura e aplicação ignorada. |
| IMAGE_DIRECTORY_ENTRY_SECURITY | 4 | Diretório de segurança - estrutura e aplicação ignorada. |
| IMAGE_DIRECTORY_ENTRY_BASERELOC | 5 | Tabela da base de remanejamento. |
| IMAGE_DIRECTORY_ENTRY_DEBUG | 6 | Diretório de debug, cujo conteúdo depende do compilador. De qualquer forma, muitos compiladores colocam as informações de debug na seção de código e não criam uma seção separada.|
| IMAGE_DIRECTORY_ENTRY_COPYRIGHT | 7 | String de descrição com alguns comentários de copyright ou coisa parecida. |
| IMAGE_DIRECTORY_ENTRY_GLOBALPTR | 8 | Valor de Máquina (MIPS GP) - estrutura e aplicação ignorada.
| IMAGE_DIRECTORY_ENTRY_TLS | 9 | Diretório de armazenamento local de thread - estrutura desconhecida. Contém variáveis que são declaradas "__declspec(thread)", isto é, variáveis globais per-thread. |
| IMAGE_DIRECTORY_ENTRY_LOAD_CONFIG | 10 | Diretório de configuração de carregamento - estrutura e aplicação ignorada. |
| IMAGE_DIRECTORY_ENTRY_BOUND_IMPORT | 11 | Diretório de importação casada (bound import). |
| IMAGE_DIRECTORY_ENTRY_IAT | 12 | Tabela de endereços de importação (IAT - Import Address Table). |

Como exemplo, se encontrarmos 2 duplo-words no índice 7, cujos valores sejam 12000 e 33, e o endereço de carregamento for 10000, sabemos que os dados de copyright estão no endereço 10000 + 12000 (independentemente da seção em que possam estar) e que o comentário de copyright tem 33 bytes de comprimento.

Se algum diretório de um tipo em particular não for usado no binário, o tamanho (Size) e o endereço virtual (VirtualAddress) são zero.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 0000&nbsp;00C0 | 50 | 45 | 00 | 00 | 4C | 01 | 04 | 00 | A3 | 77 | 55 | 3C | 00 | 00 | 00 | 00 |
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |
| 0000&nbsp;0130 | 00 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |
| 0000&nbsp;0140 | 40 | 20 | 00 | 00 | 3C | 00 | 00 | 00 | 00 | 40 | 00 | 00 | 60 | 09 | 00 | 00 |
| 0000&nbsp;0150 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |
| 0000&nbsp;0160 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |
| 0000&nbsp;0170 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |
| 0000&nbsp;0180 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |
| 0000&nbsp;0190 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 |    |    |    |    |    |    |    |    |

No nosso exemplo, no array de 12 elementos destacados em verde e vermelho, apenas os diretórios de índice 1 e 2 possuem referências.

O diretório de índice 1 refere-se aos símbolos importados: seu RVA é 0000 2040 e seu tamanho é 0000 003C. Portanto, os dados referentes aos símbolos importados estarão deslocados em 8.256 bytes (2040h = 8256d) e ocupam 60 bytes (3Ch = 60d).

O diretório de índice 2 refere-se aos recursos: seu RVA é 0000 4000 e seu tamanho é 0000 0960. Portanto, os dados referentes aos recursos estarão deslocados 16.384 bytes (4000h = 16384d) e ocupam 2400 bytes (0960h = 2400d).

#### Exercício proposto

Para este módulo, tente o seguinte:

1. A esta altura do campeonato você já deve ter uma verdadeira coleção de executáveis no formato PE. Faça uma tabela com os 12 tipos possíveis de diretórios de dados de acordo com os programas analisados. Tente descobrir quais diretórios de dados são os mais comuns.

### Cabeçalhos das seções

| :empty              |
|:-------------------:|
| Cabeçalho MZ do DOS |
| Fragmento (stub) do DOS |
| Cabeçalho do Arquivo |
| Cabeçalho OpcionalDiretório de Dados |
| Cabeçalhos das Seções |
| Seção 1 |
| Seção 2 |
| ... |
| Seção n |

As seções são compostas por duas partes principais: primeiro, a descrição da seção (do tipo IMAGE_SECTION_HEADER) e depois os dados propriamente ditos. Desta forma, logo após os diretórios de dados, encontramos um array de cabeçalhos de seções do tipo número de seções ('NumberOfSections'), ordenado pelos RVAs das seções. Um cabeçalho de seção contém:

* Um array de Nomes das Seções
* Endereço Físico e do Tamanho Virtual
* Endereço Virtual
* Tamanho dos Dados
* Ponteiro para os Dados
* Ponteiro para Remanejamento
* Características

#### Nomes das Seções

O primeiro componente é um array de IMAGE_SIZEOF_SHORT_NAME de 8 bytes para guardar o nome (ASCII) da seção. Se todos os 8 bytes forem usados não existe um terminador 0 (zero) para a string! O nome é tipicamente algo como ".data" ou ".text" ou mesmo ".bss". Não há a necessidade do nome ser precedido por um ponto '.' e não existem nome predefinidos (qualquer nome é aceito).

Os nomes também não têm qualquer relação com o conteúdo da seção. Uma seção de nome ".code" pode ou não conter código executável: pode perfeitamente conter a tabela de endereços de importação, pode conter código executável E a tabela de endereços de importação e até os dados inicializados.

Para achar informações nas seções, é preciso buscá-las nos diretórios de dados do cabeçalho opcional. Não se deixe influenciar pelo nome da seção e não assuma que os dados da seção estejam logo no início da mesma.


| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  | ASCII           |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---------------:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |                 |
| 0000&nbsp;01B0 |    |    |    |    |    |    |    |    | 2E | 74 | 65 | 78 | 74 | 00 | 00 | 00 | .text...        |
| 0000&nbsp;01C0 | 94 | 01 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 | 00 | 04 | 00 | 00 | ”...............|
| 0000&nbsp;01D0 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 20 | 00 | 00 | 60 | ............ ...|
| 0000&nbsp;01E0 | 2E | 72 | 64 | 61 | 74 | 61 | 00 | 00 | C2 | 01 | 00 | 00 | 00 | 20 | 00 | 00 | .rdata..Å.... ..|
| 0000&nbsp;01F0 | 00 | 02 | 00 | 00 | 00 | 06 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | ................|
| 0000&nbsp;0200 | 00 | 00 | 00 | 00 | 40 | 00 | 00 | 40 | 2E | 64 | 61 | 74 | 61 | 00 | 00 | 00 | ....@..@.data...|
| 0000&nbsp;0210 | 24 | 00 | 00 | 00 | 00 | 30 | 00 | 00 | 00 | 02 | 00 | 00 | 00 | 08 | 00 | 00 | $....0..........|
| 0000&nbsp;0220 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 40 | 00 | 00 | C0 | ............@..Å|
| 0000&nbsp;0230 | 2E | 72 | 73 | 72 | 63 | 00 | 00 | 00 | 60 | 09 | 00 | 00 | 00 | 40 | 00 | 00 | .rsrc...`....@..|
| 0000&nbsp;0240 | 00 | 0A | 00 | 00 | 00 | 0A | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | ................|
| 0000&nbsp;0250 | 00 | 00 | 00 | 00 | 40 | 00 | 00 | C0 |    |    |    |    |    |    |    |    | ....@..Å.........|


#### Endereço Físico e do Tamanho Virtual

O próximo membro da IMAGE_SECTION_HEADER é a união de 32 bits do Endereço Físico ('PhysicalAddress') e do Tamanho Virtual ('VirtualSize'). Num arquivo objeto, este é o endereço para o qual o conteúdo é remanejado; num executável, é o tamanho do conteúdo. Mais uma vez, este campo não é utilizado! Há linkadores que o preenchem com o tamanho, outros com o endereço e outros ainda que o preenchem com 0. Apesar disso, os executáveis não apresentam problemas.

#### Endereço Virtual

Logo a seguir vem o Endereço Virtual ('VirtualAddress'), um valor de 32 bits que contém o RVA para os dados da seção quando esta estiver mapeada na RAM.

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  | ASCII           |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---------------:|
| ...            |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |    |                 |
| 0000&nbsp;01B0 |    |    |    |    |    |    |    |    | 2E | 74 | 65 | 78 | 74 | 00 | 00 | 00 |.text...         |
| 0000&nbsp;01C0 | 94 | 01 | 00 | 00 | 00 | 10 | 00 | 00 | 00 | 02 | 00 | 00 | 00 | 04 | 00 | 00 |”............... |
| 0000&nbsp;01D0 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 00 | 20 | 00 | 00 | 60 |............ ... |

No nosso exemplo, o valor encontrado é 0000 1000, ou seja, o RVA será de 4096 bytes (destacado em azul).

#### Tamanho dos Dados

Após o endereço virtual vêm 32 bits para os Tamanho dos Dados ('SizeOfRawData'), que nada mais é do que o tamanho dos dados da seção arredondado para cima, para o próximo múltiplo de 'FileAlignment' (alinhamento de arquivo).

No nosso exemplo, o valor encontrado é 0000 0200, ou seja, o tamanho dos dados da seção é de 512 bytes (veja acima, destacado em verde).

#### Ponteiro para os Dados

Segue-se o Ponteiro para os Dados ('PointerToRawData'), também de 32 bits. Este ponteiro é extremamente útil porque é o offset do início do arquivo em disco até os dados da seção. Se for 0, os dados da seção não estão contidos no arquivo e serão carregados arbitrariamente no momento da carga do programa.

No exemplo, encontramos 0000 0400, destacado acima em vermelho. Observe o endereço 0400 deste arquivo armazenado em disco:

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  | ASCII           |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---------------:|
| 0000&nbsp;0400 | 6A | 00 | E8 | 87 | 01 | 00 | 00 | A3 | 1C | 30 | 40 | 00 | E8 | 77 | 01 | 00 | j.è‡...£.0@.èw..|

Após uma longa sucessão de zeros em endereços anteriores, em 0400 inicia-se a sucessão de dados da seção .text.

#### Ponteiro para Remanejamento

A seguir vem o Ponteiro para Remanejamento ('PointerToRelocations') de 32 bits e o Ponteiro para Números de Linha ('PointerToLinenumbers'), também de 32 bits, o Número de Remanejamentos ('NumberOfRelocations') de 16 bits e o Número de Números de Linha ('NumberOfLinenumbers'), também de 16 bits. Todas estas informações somente são utilizadas para arquivos objeto. Os executáveis não possuem um diretório de remanejamento base especial e a informação de número de linha, se é que está presente, geralmente está localizada num segmento especial para debugging ou em qualquer outro lugar.

No exemplo, todas estas posições estão preenchidas com zeros (observe a linha 01D0 acima).

#### Características

O último membro dos cabeçalhos das seções é o valor de 32 bits com as Características. São um punhado de flags que descrevem como a memória das seções deve ser tratada:

| Nome | Bit | Setado (valor 1) |
|:----:|:---:|:----------------:|
| IMAGE_SCN_CNT_CODE               | 5  | A seção contém código executável. |
| IMAGE_SCN_CNT_INITIALIZED_DATA   | 6  | A seção contém dados que recebem um valor definido antes que a execução se inicie. Em outras palavras: os dados da seção são significativos. |
| IMAGE_SCN_CNT_UNINITIALIZED_DATA | 7  | A seção contém dados não inicializados que terão todos os bytes zerados antes que a execução se inicie. Este, geralmente, é o BSS. |
| IMAGE_SCN_LNK_INFO               | 9  | A seção não contém dados de imagem e sim comentários, descrições ou outra documentação qualquer. Esta informação faz parte de arquivos objeto e pode ser a informação para o linker, como, por exemplo, as bibliotecas necessárias. |
| IMAGE_SCN_LNK_REMOVE             | 11 | Os dados fazem parte de uma seção de um arquivo objeto que deve ser deixado de fora quando o arquivo executável for linkado. Com frequência este bit está combinado com o bit 9. |
| IMAGE_SCN_LNK_COMDAT             | 12 | A seção contém o "common block data", que são funções de pacotes. |
| IMAGE_SCN_MEM_FARDATA            | 15 | Existe 'far data' - significado incerto. |
| IMAGE_SCN_MEM_PURGEABLE          | 17 | Os dados da seção podem sofrer um 'purge' - não é o mesmo que descartáveis, pois há um bit para este fim (veja abaixo). O mesmo bit, aparentemente, é usado para indicar informações de 16 bits - significado incerto. |
| IMAGE_SCN_MEM_LOCKED             | 18 | Significado incerto - a seção não pode ser deslocada na memória? - não há informação de remanejamento? |
| IMAGE_SCN_MEM_PRELOAD            | 19 | Significado incerto - a seção deve ser "paginada" antes do início da execução? |
|                                  | 20 a 23 | Especificam um alinhamento. Não há informações disponíveis. Existe um #define IMAGE_SCN_ALIGN_16BYTES e parecidos...  |
| IMAGE_SCN_LNK_NRELOC_OVFL        | 24 | A seção contém alguns remanejamentos extendidos - significado incerto. |
| IMAGE_SCN_MEM_DISCARDABLE        | 25 | Os dados da seção não são necessários após o início do processo. É o caso, por exemplo, das informações de remanejamento. São encontradas também para rotinas de startup de drivers e serviços que são executados apenas uma vez e para diretórios de importação. |
| IMAGE_SCN_MEM_NOT_CACHED         | 26 | Os dados da seção não devem ir para cache. (Será que significa desligar o cache de segundo nível?) |
| IMAGE_SCN_MEM_NOT_PAGED          | 27 | Os dados da seção não devem sair da página. Isto é interessante para drivers. |
| IMAGE_SCN_MEM_SHARED             | 28 | Os dados da seção são compartilhados entre todas as instâncias das imagens que estiverem sendo executadas. Se forem os dados inicializados de uma DLL, por exemplo, todos os conteúdos das mesmas variáveis serão os mesmos em todas as instâncias da DLL. Note que apenas a seção da primeira instância é inicializada. Seções contendo código são sempre compartilhadas copy-on-write, isto é, o compartilhamento não funciona se houver a necessidade de fazer remanejamentos. |
| IMAGE_SCN_MEM_EXECUTE            | 29 | O processo recebe acesso de 'execução' na memória da seção. |
| IMAGE_SCN_MEM_READ               | 30 | O processo recebe acesso de 'leitura' na memória da seção. |
| IMAGE_SCN_MEM_WRITE              | 31 | O processo recebe acesso de 'escrita' na memória da seção. |

Analisando os últimos 32 bits do cabeçalho da seção .text, destacados em magenta logo acima, obtemos o hexadecimal 6000 0020. Abrindo-o em bits para poder analisar este valor, constatamos o seguinte:

| Hexa    | 60 | 00 | 00 | 20 |
|:-------:|:--:|:--:|:--:|:--:| 
| Binário |  1 | 1  | 0  |  0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Bits    | 31 | 30 | 29 | 28 | 27 | 26 | 25 | 24 | 23 | 22 | 21 | 20 | 19 | 18 | 17 | 16 | 15 | 14 | 13 | 12 | 11 | 10 | 9 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 | 0 |

Relevante na seção .text são os seguintes bits:

* Bit 5 = 0: A seção NÃO contém código executável.
* Bit 7 = 1: A seção contém dados não inicializados.
* Bit 29 = 0: O processo NÃO recebe acesso de 'execução'.
* Bit 30 = 1: O processo recebe acesso de 'leitura'.
* Bit 31 = 1: O processo recebe acesso de 'escrita'.


#### Exercícios propostos

Para este módulo, tente o seguinte:

1. Abra os bits de Características das seções .rdata e .data do programa exemplo. Quais as diferenças entre estas seções?

2. Abra outro programa e determine as Características das suas seções.

3. Determine o endereço virtual das seções do programa exemplo e verifique se aponta para o início dos dados das respectivas seções.

4. Faça o mesmo com um outro executável qualquer.

### Seções

| :empty              |
|:-------------------:|
| Cabeçalho MZ do DOS |
| Fragmento (stub) do DOS |
| Cabeçalho do Arquivo |
| Cabeçalho OpcionalDiretório de Dados |
| Cabeçalhos das Seções |
| Seção 1 |
| Seção 2 |
| ... |
| Seção n |

Após os cabeçalhos das seções seguem as seções propriamente ditas com os dados nus (raw data). Dentro do arquivo, elas estão alinhadas em 'FileAlignment' bytes, ou seja, após o cabeçalho opcional e após cada uma das seções haverá bytes zerados de preenchimento para atingir o tamanho 'FileAlignment'. Além disto, estão ordenadas pelos seus RVAs. Quando carregadas na RAM, as seções são alinhadas de acordo com o 'SectionAlignment'.

Exemplificando: se o cabeçalho opcional, no arquivo, terminar no offset 981 e o 'FileAlignment' for 512, a primeira seção começará no byte 1024. Note que é possível encontrar o início das seções através do Ponteiro de Dados ('PointerToRawData') ou através do Endereço Virtual ('VirtualAddress') de modo que, dificilmente, será necessário ficar perdendo tempo com alinhamentos.

Existe um cabeçalho de seção para cada seção e cada diretório de dados apontará para uma das seções. Vários diretórios de dados podem apontar para a mesma seção e também podem existir seções que não sejam apontadas pelo diretório de dados.

Os tópicos cobertos neste texto são os seguintes:

* Considerações gerais
* Seção 'code'
* Seção 'data'
* Seção 'bss'
* Copyright
* Símbolos exportados
* Símbolos importados
* Recursos
* Remanejamentos

#### Considerações gerais

Repetindo: todas as seções estão alinhadas pelo 'SectionAlignment' quando mapeadas na RAM e pelo 'FileAlignment' quando no arquivo em disco (se necessário, reveja em cabeçalho opcional). As seções são descritas através de entradas nos cabeçalhos das seções - encontra-se o início das seções no arquivo em disco através do 'PointerToRawData' e na memória através do 'VirtualAddress'; o tamanho está em 'SizeOfRawData' (se necessário, reveja em cabeçalho das seções).

Existem vários tipos de seções, dependendo do seu conteúdo. Na maioria dos casos (mas não em todos) existe um diretório de dados numa seção, indicado com um ponteiro residente no array do diretório de dados do cabeçalho opcional.

#### Seção code

Esta seção tem, no mínimo, os bits 'IMAGE_SCN_CNT_CODE', 'IMAGE_SCN_MEM_EXECUTE' e 'IMAGE_SCN_MEM_READ' setados com valor 1 (se necessário, reveja em cabeçalho das seções) e o 'AddressOfEntryPoint' apontará para algum lugar dentro desta seção onde está o início da função que o programador determinou como a primeira a ser executada (se necessário, reveja em cabeçalho opcional).

'BaseOfCode' normalmente apontará para o início desta seção, porém pode apontar além do início se alguns bytes que não são código forem colocados antes do código propriamente dito (se necessário, reveja em cabeçalho opcional).

Geralmente não existe nada além de código executável nesta seção e haverá apenas uma seção com o nome 'code', porém não se fie nisso.

Nomes típicos para esta seção de código executável são ".text", ".code", "AUTO" e coisas do gênero.

O Ponteiro para os Dados ('PointerToRawData') é o offset do início do arquivo em disco até os dados desta seção. No programa exemplo encontramos o valor 0000 0400. Como o tamanho da seção é de 512 bytes (ou 200h), está armazenada em disco de 0000 0400 até o endereço 0000 05FF. Observe os primeiros 16 bytes:

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  | ASCII           |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---------------:|
| 0000&nbsp;0400 | 6A | 00 | E8 | 87 | 01 | 00 | 00 | A3 | 1C | 30 | 40 | 00 | E8 | 77 | 01 | 00 | j.è‡...£.0@.èw..|

#### Seção data

O próximo assunto será sobre variáveis inicializadas. Esta seção contém variáveis estáticas inicializadas (do tipo "static int i = 5;"). Terá, no mínimo, os bits 'IMAGE_SCN_CNT_INITIALIZED_DATA', 'IMAGE_SCN_MEM_READ' e 'IMAGE_SCN_MEM_WRITE' setados com valor 1 (se necessário, reveja em cabeçalho das seções). Alguns linkers podem colocar constantes em uma seção própria que não possui o bit 'writeable' (escrita permitida). Se parte dos dados for compartilhável ou se existirem outras peculiaridades, pode haver outras seções com os bits de seção apropriadamente setados.

A seção (ou seções) estará situada entre 'BaseOfData' e 'BaseOfData' + 'SizeOfInitializedData'.

Nomes típicos para esta seção são ".data", ".idata", "DATA" e parecidos.

O Ponteiro para os Dados ('PointerToRawData') é o offset do início do arquivo em disco até os dados desta seção. No programa exemplo encontramos o valor 0000 0800. Observe os primeiros 16 bytes:

| Offset         | 0  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  | A  | B  | C  | D  | E  | F  | ASCII           |
|:--------------:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---------------:|
| 0000&nbsp;0800 | 4A | 61 | 6E | 65 | 6C | 61 | 4E | 75 | 61 | 00 | 4A | 61 | 6E | 65 | 6C | 69 | JanelaNua.Janeli|

#### Seção bss

O assunto seguinte é sobre dados não inicializados (para variáveis estáticas, tipo "static int k;"). Esta seção é bastante parecida com a seção de dados inicializados, porém terá um offset de arquivo em disco ('PointerToRawData') de 0, indicando que seu conteúdo não está armazenado no arquivo. Além disto, 'IMAGE_SCN_CNT_UNINITIALIZED_DATA' está setado com valor 1 ao invés de 'IMAGE_SCN_CNT_INITIALIZED_DATA', indicando que o conteúdo deve ser preenchido com bytes 0 (zero) durante o carregamento. Isto significa que existe um cabeçalho de seção, porém não existe a seção no arquivo. A seção será criada pelo carregador e consistirá inteiramente de bytes 0. O tamanho será de 'SizeOfUninitializedData'.

Nomes típicos são ".bss", "BSS" e parecidos.

Estas são as seções de dados que NÃO são apontadas através de diretórios de dados. Seu conteúdo e estrutura são fornecidos pelo compilador e não pelo linker.

(O segmento de pilha - stack-segment - e o segmento de heap - heap-segment - não são seções do binário. São criados pelo carregador de acordo com os campos stacksize e heapsize do cabeçalho opcional.)

Como o binário usado como exemplo não possui dados não inicializados, o mesmo não possui uma seção deste tipo.

#### Copyright

Para começar com uma seção-diretório simples, vamos dar uma olhada no 'IMAGE_DIRECTORY_ENTRY_COPYRIGHT' do diretório de dados. O conteúdo é um copyright ou uma string descritiva em ASCII (não terminada em 0) como "TallyBan control application, copyright © 1800 NhacaSoft & Cia". Normalmente esta string é fornecida ao linker através da linha de comando ou através de um arquivo de descrição.

Esta string não é necessária em tempo de execução e pode ser descartada. Não tem acesso de escrita - na verdade, o aplicativo não precisa de acesso nenhum. Deste modo, o linker vai constatar se já existe ou não uma seção sem acesso de escrita e descartável. Se não existir, cria uma seção com o nome de ".descr" ou algo parecido, joga a string dentro dela e faz com que o ponteiro de diretório de copyright aponte para a string. O bit 'IMAGE_SCN_CNT_INITIALIZED_DATA' também deve ser setado com valor 1.

O programa exemplo não foi compilado com informações de copyright, portanto, o ponteiro de diretório de copyright contém apenas zeros e o binário não apresenta esta seção.

#### Símbolos exportados

A próxima coisa mais simples é o diretório de exportação, 'IMAGE_DIRECTORY_ENTRY_EXPORT'. Este é um diretório tipicamente encontrado em DLLs. Contém os pontos de entrada de funções exportadas (e os endereços de objetos exportados, etc). É claro que executáveis também podem ter símbolos exportados mas, geralmente, não têm.

A seção que abriga símbolos exportados deve ser do tipo "dados inicializados" e "para leitura". Não deve ser "descartável" porque o processo pode chamar um `GetProcAddress()` para procurar um ponto de entrada de uma função em tempo de execução. Esta seção normalmente é denominada de ".edata" se estiver individualizada; com bastante frequência está fundida com alguma outra seção como "dados inicializados".

A estrutura da tabela de exportação ('IMAGE_EXPORT_DIRECTORY') é composta por um cabeçalho e os pelos dados de exportação, ou seja, o nome dos símbolos, seus ordinais e os offsets dos seus pontos de entrada.

Primeiro temos 32 bits de 'Characteristics' que não são utilizados e normalmente são 0. Depois vem um 'TimeDateStamp' de 32 bits, o qual presumivelmente deveria indicar a data e hora em formato time_t em que a tabela foi criada; aliás, nem sempre é válido (alguns linkers lhe atribuem 0). Depois temos 2 words de 16 bits para a informação da versão ('MajorVersion' e 'MinorVersion') e estes, também, com frequência estão zerados.

Os próximos 32 bits são para o nome ('Name'). Este é um RVA para o nome da DLL representada por uma string ASCII terminada em 0 (o nome é necessário caso o arquivo DLL seja renomeado - veja "binding" no diretório de importação). Depois temos a base ('Base') de 32 bits, que será tratada logo a seguir.

O próximo valor de 32 bits é o número total de itens exportados ('NumberOfFunctions'). Além do seu número ordinal identificador, os itens podem ser exportados sob diversos nomes - e o próximo número de 32 bits é o número total de nomes exportados ('NumberOfNames').

Na maioria dos casos, cada item exportado terá exatamente um nome que lhe corresponde e será usado com este nome, porém um item pode ter vários nomes associados (e ser acessado por cada um deles), ou poderá não ter nome algum e só ser acessível através do seu número ordinal. O uso de exportações sem nome (apenas pelo ordinal) é desencorajado porque todas as versões da DLL exportadora precisariam usar a mesma numeração ordinal gerando um problema de manutenção.

O próximo valor de 32 bits, o `AddressOfFunctions`, é um RVA para a lista dos itens exportados. Aponta para um array de valores de 32 bits de 'NumberOfFunctions', cada qual um RVA para a função exportada ou variável.

Há dois desvios nesta lista. Primeiro, o RVA pode ser 0 e, neste caso, não é utilizado. Segundo, se o RVA apontar para uma seção contendo o diretório de exportação, acaba fazendo uma exportação remetida. Uma exportação prematura é um ponteiro para uma exportação em outro binário - se for usado, a exportação apontada no outro binário é que será usada. Neste caso, o RVA aponta, como mencionado, na a seção do diretório de exportação, para uma string terminada em 0 correspondente ao nome da DLL apontada e o nome exportado separados por um ponto, como "outradll.nomeexportado", ou o nome da DLL e o ordinal exportado, como "outradll.#19".

Chegou a hora de explicar o ordinal de exportação. Este ordinal é um índice para o array AddressOfFunctions, a posição baseada em 0 mais a 'Base' mencionada acima.

Na maioria dos casos a base é 1, o que significa que o primeiro exportado tem um ordinal de 1, o segundo de 2 e assim por diante.

Após o RVA `AddressOfFunctions` encontra-se um RVA para o array de RVAs de 32 bits para os nomes dos símbolos 'AddressOfNames' e um RVA para o array de ordinais de 16 bits `AddressOfNameOrdinals`. Ambos possuem elementos 'NumberOfNames'.

Os nomes dos símbolos podem simplesmente não existir. Neste caso, 'AddressOfNames' é 0. Caso contrário, os arrays apontados correm em paralelo, significando que seus elementos em cada item estão atrelados. O array 'AddressOfNames' consiste de RVAs para nomes de exportação terminados em 0; os nomes são mantidos numa lista ordenada (isto é, o primeiro membro do array é o RVA para o nome alfabeticamente menor; isto permite uma procura eficiente quando duma procura de um símbolo exportado pelo nome).

De acordo com a especificação do PE, o array `AddressOfNameOrdinals` possui um ordinal que corresponde a cada um dos nomes. Entretanto, o que pude verificar é que este array contém o índice atual do array `AddressOfFunctions`.

Segue um esquema das três tabelas:

```
                    `AddressOfFunctions`
                             |
                             V
           RVA exportado com o ordinal 'Base'
          RVA exportado com o ordinal 'Base' + 1
                             ...
  RVA exportado com o ordinal 'Base' + 'NumberOfFunctions' - 1



   'AddressOfNames'                         `AddressOfNameOrdinals`
           |                                        |
           V                                        V
RVA para o primeiro nome        <-> Índice da exportação do primeiro nome
RVA para o segundo nome         <-> Índice da exportação do segundo nome
          ...                                      ...
RVA para o nome 'NumberOfNames' <-> Índice da exportação para o nome 'NumberOfNames'
```

Alguns exemplos para ajudar a entender:

Para achar um símbolo exportado pelo seu ordinal, subtraia a 'Base' para obter o índice, siga o RVA `AddressOfFunctions` para encontrar o array de exportações e use o índice para achar o RVA exportado no array. Se o RVA não apontar para a seção de exportação, terminou a procura. Caso contrário, ele aponta para uma string que descreve a DLL exportadora e o nome ou o ordinal dentro dela, e você precisa procurar pela exportação remetida adiante.

Para achar um símbolo exportado pelo nome, siga o RVA 'AddressOfNames' (se contiver 0 não existem nomes) para encontrar o array de RVAs para os nomes exportados. Procure o nome desejado na lista. Use o índice do nome no array `AddressOfNameOrdinals` e obtenha o número de 16 bits correspondente ao nome encontrado. De acordo com a especificação PE, é um ordinal e você precisa subtrair a base para obter o índice de exportação - de acordo com a minha experiência, este já é o índice e você não precisa subtrair a base. Usando o índice de exportação você encontra o RVA de exportação no array `AddressOfFunctions`, sendo ou o próprio RVA de exportação ou um RVA para a string descrevendo uma exportação remetida.

#### Símbolos importados

Quando o compilador encontra uma chamada para uma função que esteja localizada num executável à parte (geralmente uma DLL), nos casos mais simples ele desconhece as circunstâncias e simplesmente gera uma instrução de chamada normal para este símbolo, cujo endereço o linker terá que ajustar da mesma maneira como faz para qualquer símbolo externo.

O linker usa uma biblioteca de importações para verificar qual é o símbolo de qual DLL que está sendo importado e produz "stubs" (fragmentos) para todos os símbolos importados. Cada fragmento consiste numa instrução de salto e é o alvo da chamada. Estas instruções de salto provocam um salto para um endereço que está na assim chamada tabela de endereços de importação. Em aplicativos mais sofisticados (quando uma `__declspec(dllimporta)` é usada), o compilador conhece a função importada e produz uma chamada direta para o endereço na tabela de endereços de importação sem fazer uso do salto.

De qualquer forma, o endereço da função na DLL sempre é necessário e será suprido pelo carregador a partir do diretório de exportação da DLL exportadora quando o aplicativo for carregado. Verificando o diretório de importação, o carregador sabe quais símbolos de quais bibliotecas precisam ser verificados e ter seus endereços ajustados.

É melhor dar um exemplo. As chamadas com ou sem `__declspec(dllimporta)` têm o seguinte aspecto:

fonte:
```c
int symbol(char *); 
__declspec(dllimporta) 
int symbol2(char*); 
void foo(void) { 
    int i = symbol("bar"); 
    int j = symbol2("baz"); 
}
```

assembly:

```assembly
... 
call _symbol ; sem declspec(dllimporta) 
... 
call [__imp__symbol2] ; com declspec(dllimporta) 
...
```

No primeiro caso (sem `__declspec(dllimporta)`), o compilador não sabia que '\_symbol' estava numa DLL de modo que o linker precisa prover a função `_symbol`. Já que a função não está disponível, ele gerará um fragmento de função para o símbolo importado, o qual é um salto indireto. A coleção de todos os fragmentos de importação é denominada de "área de transferência" (às vezes também chamada de "trampolim" porque dá-se um salto para ir para um outro lugar).

Esta área de transferência fica tipicamente localizada na seção de código (code section) mas não faz parte do diretório de importação. Cada um dos fragmentos de função é um salto para a função das DLLs alvo. A área de transferência tem o seguinte aspecto:

```assembly
_symbol: jmp [__imp__symbol]
_outrosymbol: jmp [__imp__outro__symbol]
... 
```

Isto significa que, se você utilizar símbolos importados sem especificar `__declspec(dllimporta)`, então o linker gerará uma área de transferência para eles composta por saltos indiretos. Se você especificar `__declspec(dllimporta)`, o compilador fará o redirecionamento e a área de transferência deixa de ser necessária. Isto também significa que, se você importar variáveis ou outra coisa qualquer, é preciso especificar `__declspec(dllimporta)` por que um fragmento com uma instrução de salto é apropriado apenas para funções.

Em qualquer caso, o endereço do símbolo 'x' é armazenado no local `__imp_x`. Todos estes locais juntos compõem a assim chamada "tabela de endereços de importação", a qual é fornecida pelo linker através das bibliotecas de importação das várias DLLs que estejam sendo usadas. A tabela de endereços de importação é uma lista de endereços parecida com:

```assembly
__imp_symbol: 0xDEADBEEF
__imp_symbol2: 0x40100
__imp_symbol3: 0x300100
... 
```

Esta tabela de endereços de importação faz parte do diretório de importação e é apontada pelo ponteiro de diretório IMAGE_DIRECTORY_ENTRY_IAT (apesar de que, mesmo que alguns linkers não especifiquem esta entrada de diretório, a coisa também funciona perfeitamente; aparentemente, o carregador consegue resolver importações mesmo sem utilizar o diretório IMAGE_DIRECTORY_ENTRY_IAT).

Os endereços desta tabela são desconhecidos para o linker. O linker insere bobagens (RVAs para os nomes das funções; veja abaixo para maiores informações) que são inseridas pelo carregador em tempo de carregamento usando o diretório de exportação da DLL exportadora. A tabela de endereços de importação e como ela é localizada pelo carregador será descrito em maiores detalhes logo adiante.

Observe que esta descrição é específica para C. Existem outros ambientes de desenvolvimento que não utilizam as bibliotecas de importação. Apesar disso, todos precisam gerar uma tabela de endereços de importação a qual eles usam para permitir que seus programas acessem os objetos e funções importadas. Os compiladores C costumam utilizar as bibliotecas de importação porque é de sua conveniência - seus linkers usam as bibliotecas de qualquer forma. Outros ambientes usam, por exemplo, um arquivo descritivo que lista os nomes das DLLs e os nomes das funções necessárias (como o "arquivo de definição de módulo" - "module definition file") ou uma lista no estilo declaração no fonte.

Esta é a forma como as importações são utilizadas pelo código do programa. Agora vamos dar uma olhada em como é construído um diretório de importação para que o carregador possa usá-lo.

O diretório de importação deve residir numa seção que seja de "dados inicializados" ("initialized data") e "para leitura" ("readable").

O diretório de importação é um array de IMAGE_IMPORT_DESCRIPTORs, um para cada DLL usada. A lista é terminada por um IMAGE_IMPORT_DESCRIPTOR inteiramente preenchido com bytes 0.

O IMAGE_IMPORT_DESCRIPTOR é uma estrutura com os seguintes membros:

* OriginalFirstThunk: Um RVA (32 bits) apontando para um array terminado em 0 de RVAs para os IMAGE_THUNK_DATAs, cada um descrevendo uma função importada. O array nunca muda.

* TimeDateStamp: Um carimbo de 32 bits com vários propósitos. Imagine que o timestamp seja 0 e deixe os casos avançados para mais tarde.

* ForwarderChain: O índice de 32 bits do primeiro remetente (forwarder) na lista de funções importadas. Remetentes também é assunto avançado: para principiantes, setar todos os bits em 1.

* Name: Um RVA de 32 bits para o nome da DLL (uma string ASCII terminada em 0).

* FirstThunk: Um RVA de 32 bits para um array de RVAs terminado em 0 para os IMAGE_THUNK_DATAs, cada um descrevendo uma função importada. O array faz parte da tabela de endereços de importação e será mudado.

Percebe-se que cada IMAGE_IMPORT_DESCRIPTOR é um array que fornece o nome da DLL exportadora e, com exceção do remetente (forwarder) e do carimbo (timedatestamp), fornece 2 RVAs para arrays de IMAGE_THUNK_DATAs usando 32 bits. O último elemento de cada array é inteiramente preenchido com bytes 0 para marcar a finalização.

Cada IMAGE_THUNK_DATA é, por enquanto, um RVA para um IMAGE_IMPORT_BY_NAME, o qual descreve a função importada.

O aspecto interessante vem agora: os arrays correm em paralelo, isto é, eles apontam para os mesmos IMAGE_IMPORT_BY_NAMEs.

Não há motivo para se desesperar, vou explicar de outra forma. Este é o conteúdo essencial de um IMAGE_IMPORT_DESCRIPTOR:

OriginalFirstThunk                   FirstThunk
         |                                |
         V                                V
       0 -->          função 1          <-- 0
       1 -->          função 2          <-- 1
       2 -->          função 3          <-- 2
       3 -->            foo             <-- 3
       4 -->       qualquercoisa        <-- 4
       5 --> 0                        0 <-- 5

O último RVA é 0 (zero)!

Os nomes no centro são os IMAGE_IMPORT_BY_NAMEs. Cada um deles é um número de 16 bits (um hint) seguido por uma quantidade não específica de bytes, sendo o nome em ASCII terminado por 0 do símbolo importado.

O hint é um índice da tabela de nomes da DLL exportadora (veja diretório de exportação acima). O nome neste índice é tentado e, se não houver coincidência, uma busca binária é efetuada para encontrar o nome. Alguns linkers nem se preocupam em procurar hints corretos e simplesmente especificam 1 todas as vezes, ou qualquer outro número arbitrário. Isto não traz problemas, apenas faz com que a primeira tentativa para resolver o nome falhe, forçando desta forma uma busca binária para cada um dos nomes.

Resumindo, se você quiser encontrar informações a respeito da função importada "qualquercoisa" da DLL "nhaca", primeiro precisa encontrar a entrada IMAGE_DIRECTORY_ENTRY_POINT nos diretórios de dados, pegar um RVA, achar este endereço na seção de dados e agora ter à disposição um array de IMAGE_IMPORT_DESCRIPTORs. Pegue o elemento deste array que esteja relacionado com a DLL "nhaca" inspecionando as strings apontadas pelo nome. Quando tiver encontrado o IMAGE_IMPORT_DESCRIPTOR correto, siga seu 'OriginalFirstThunk' e localize o array apontado de IMAGE_THUNK_DATAs. Inspecione os RVAs e encontre a função "qualquercoisa".

Muito bem, mas porque há a necessidade de DUAS listas de ponteiros para os IMAGE_IMPORT_BY_NAMEs? É por que, em tempo de execução, o aplicativo não precisa do nome das funções importadas e sim dos endereços. É onde a tabela de endereços de importação aparece novamente. O carregador irá procurar cada um dos símbolos importados no diretório de exportação da DLL em questão e trocar o elemento do IMAGE_THUNK_DATA da lista de 'FirstThunk' (o qual, até este momento, também apontava para o IMAGE_IMPORT_BY_NAME) pelo endereço linear do ponto de entrada da DLL.

Lembre-se da lista de endereços com labes como "\__imp_symbol". A tabela de endereços de importação, apontada pelo IMAGE_DIRECTORY_ENTRY_IAT do diretório de dados, é exatamente a lista apontada pelo 'FirstThunk'. No caso de importações de várias DLLs, a tabela de endereços de importação contém os arrays de 'FirstThunk' de todas elas. A entrada de diretório IMAGE_DIRECTORY_ENTRY_IAT pode estar faltando e, mesmo assim, as importações funcionarão bem.

O 'OriginalFirstThunk' permanece intocado, de modo que sempre é possível analisar a lista original de nomes importados.

A importação, agora, foi adequada com os endereços lineares corretos e tem o seguinte aspecto:

OriginalFirstThunk                   FirstThunk
         |                                |
         V                                V
       0 -->          função 1          <-- função 1 exportada
       1 -->          função 2          <-- função 2 exportada
       2 -->          função 3          <-- função 3 exportada
       3 -->            foo             <-- foo exportada
       4 -->       qualquercoisa        <-- qualquercoisa exportada
       5 --> 0                        0 <-- 5

Esta é a estrutura básica para casos simples. Agora veremos uns macetes dos diretórios de importação.

Primeiramente, o bit IMAGE_ORDINAL_FLAG no array (ou seja, o MSB) do IMAGE_THUNK_DATA pode ser setado (valor 1). Neste caso, não existem informações de nomes de símbolos na lista e o símbolo é importado exclusivamente através do seu ordinal. Você obtém o ordinal inspecionando o word menos significante (lower word) do IMAGE_THUNK_DATA.

A importação através de ordinais é desencorajada. É muito mais seguro importar por nomes porque os ordinais de exportação podem mudar se a DLL exportadora não for a da versão esperada.

Em segundo lugar, existem as assim chamadas "importações casadas" (bound imports).

Imagine as tarefas do carregador: quando um binário que ele queira executar precisa de uma função de uma DLL, o carregador carrega a DLL, localiza seu diretório de exportação, encontra o RVA da função e calcula o ponto de entrada da função. A seguir, substitui na posição correspondete da lista 'FirstThunk' o endereço assim encontrado.

Supondo que o programador tenha sido esperto e forneceu um endereços preferenciais de carregamento únicos para as DLLs, que não colidam com nada, pode-se inferir que os pontos de entrada das funções serão sempre os mesmos. Eles podem ser calculados e substituir a lista de 'FirstThunk' em tempo de linkagem e é exatamente isto o que ocorre com as "importações casadas". (O utilitário "bind" faz isto; faz parte do Win32 SDK.)

É claro que todo cuidado é pouco: a DLL do usuário pode ser de uma versão diferente ou talvez seja necessário remanejar a DLL e, desta forma, a lista de 'FirstThunk' substituída torna-se inválida. Neste caso, o carregar ainda poderá optar pela lista de 'OriginalFirstThunk', achar os símbolos importados e fazer a substituição na lista de 'FirstThunk' novamente. O carregador sabe que isto é necessário quando: a)a versão da DLL exportadora não confere ou b) a DLL exportadora foi remanejada.

Não é problema para o carregador constatar que houve remanejamentos mas, e no caso de versões diferentes? É onde o 'TimeDateStamp' do IMAGE_IMPORT_DESCRIPTOR entra em ação. Se for 0, a lista de importação não foi ligada e o carregador precisa corrigir os pontos de entrada. Caso contrário, as importações estão casadas e o 'TimeDateStamp' precisa ser igual ao 'TimeDateStamp' do cabeçalho de arquivo da DLL exportadora. Se não conferir, o carregador assume que o binário está casado com a DLL "errada" e (fará o divórcio ? hehehe, não...) fará uma nova substituição na lista de importação.

Existe um macete adicional a respeito dos "remetentes" (forwarders) na lista de importação. A DLL pode exportar um símbolo que não esteja definido na prórpia DLL, mas sim, importado de outra DLL. Tal símbolo é denominado de remetido (forwarded).

Obviamente, não é possível constatar se o ponto de entrada deste símbolo é válido apenas olhando para o timestamp de uma DLL não contém o dito ponto de entrada. Por uma questão de segurança, os pontos de entrada de símbolos remetidos precisam ser corrigidos. Na lista de importação de um binário, as importações de símbolos remetidos precisam ser localizados para que o carregador possa fazer as substituições necessárias.

Isto é feito através da cadeia de remessa ('ForwarderChain'). É um índice dentro da lista de thunk. A importação na posição indexada é uma exportação remetida e o conteúdo da lista de 'FirstThunk' nesta posição é o índice da PRÓXIMA importação remetida, e assim por diante, até que o índice seja "-1", indicando que não existem mais remessas. Se não existirem remetidos, a 'ForwarderChain' é -1.

O que foi dito até agora constitui o assim chamado "estilo antigo" de ligações. Neste ponto seria interessante rever a matéria wink

Muito bem. Vou assumir que você tenha achado o IMAGE_DIRECTORY_ENTRY_IMPORT e que, seguindo-o, tenha encontrado o diretório de importações, o qual estará contido em uma das seções. Agora você se encontra no início de um array de IMAGE_IMPORT_DESCRIPTORs, o último dos quais está totalmente preenchido com 0.

Para decifrar um dos IMAGE_IMPORT_DESCRIPTORs, você olha primeiro o campo 'Name', segue o RVA e efetivamente encontra o nome da DLL exportadora. A seguir, você determina se as importações estão casadas ou não (solteiras???) - o 'TimeDateStamp' diferente de 0 indica importações casadas. Se estiverem casadas, agora é uma boa hora para checar se a versão da DLL confere com a sua comparando o 'TimeDateStamp' de ambas.

Agora você segue o RVA do 'OriginalFirstThunk' para chegar no array IMAGE_THUNK_DATA. Percorra este array (o último elemento está preenchido com 0) e cada um dos elementos será um RVA de um IMAGE_IMPORT_BY_NAME (a não ser que o bit mais significante esteja setado, fazendo com que você não tenha um nome mas um mero ordinal à disposição). Siga o RVA e pule dois bytes (o hint). Agora você está frente a frente com uma string ASCII terminada em 0 que é o nome da função importada.

Para achar o endereço do ponto de entrada fornecido no caso de ser uma importação casada, siga o 'FirstThunk' e desloque-se paralelamente ao array 'OriginalFirstThunk'. Os elementos do array são os endereços lineares do pontos de entrada (esquecendo o tópico dos remetentes por um momento).

Há uma coisa que não foi mencionada até agora: aparentemente existem linkers que geram um bug quando constroem o diretório de importação (encontrei este bug usando um linker do Borland C). Estes linkers atribuem o valor 0 ao 'OriginalFirstThunk' no IMAGE_IMPORT_DESCRIPTOR e criam apenas o array de 'FirstThunk'. É óbvio que diretórios deste tipo não podem ser ligados (as informações necessárias para reconstruir as importações foram perdidas - você não vai conseguir achar os nomes das funções). Neste caso, você terá que seguir o array do 'FirstThunk' para obter os nomes dos símbolos importados e você nunca terá endereços de pontos de entrada pre-ajustados. Encontrei um documento do TIS ([6]) descrevendo o diretório de importação de uma maneira que é compatível com este bug. Esta, provavelmente, é a origem deste bug. O documento da TIS especifica:

IMPORT FLAGS
TIME/DATE STAMP
MAJOR VERSION - MINOR VERSION
NAME RVA
IMPORT LOOKUP TABLE RVA
IMPORT ADDRESS TABLE RVA 

contrariamente à estrutura proposta em outras especificações:

OriginalFirstThunk
TimeDateStamp
ForwarderChain
Name
FirstThunk

O último macete sobre diretórios de importação é a assim chamada ligação no "estilo novo" (new style binding) (descrito em [3]), que também pode ser obtida com o utilitário "bind". Quando usado, todos os bits do 'TimeDateStamp' são setados em 1 e não existe a ForwarderChain. Todos os símbolos importados têm seus endereços substituídos, sendo do tipo remetido ou não. Mesmo assim, ainda é preciso conhecer a versão das DLLs e distinguir símbolos remetidos dos normais. Para este propósito, o diretório IMAGE_DIRECTORY_ENTRY_BOUND_IMPORT é criado. Este diretório, se é que entendi bem, NÃO ficará numa seção, mas sim no cabeçalho, logo após os cabeçalhos das seções a antes da primeira seção. (Não fui eu quem invetou esse negócio, estou apenas descrevendo!)

Este diretório indica, para cada uma das DLLs usadas, de quais outras DLLs vem as exportações remetidas.

A estrutura é um IMAGE_BOUND_IMPORT_DESCRIPTOR contendo (nesta ordem):

* Um número de 32 bits com o 'TimeDateStamp' da DLL
* Um número de 16 bits, 'OffsetModuleName', que é o offset do início do diretório para o nome terminado em 0 da DLL
* Um número de 16 bits, 'NumberOfModuleForwarderRefs', que é o número de DLLs que essa DLL usa para seus remetentes.

Imediatamente após esta estrutura encontra-se a estrutura do 'NumberOfModuleForwarderRefs' que contém os nomes e versões das DLLs que a partir das quais esta DLL faz as remessas. Estas estruturas são 'IMAGE_BOUND_FORWARDER_REF:

* Um número de 32 bits para o 'TimeDateStamp'
* Um número de 16 bits para o 'OffsetModuleName', que é o offset do início do diretório para o nome terminado em 0 da DLL remetente.
* 16 bits não utilizados

Seguindo o 'IMAGE_BOUND_FORWARDER_REF' fica o próximo 'IMAGE_BOUND_IMPORT_DESCRIPTOR' e assim sucessivamente. A lista é terminada por um IMAGE_BOUND_IMPORT_DESCRIPTOR com todos os bits zerados.

É isso aí, este é o jeitão do "novo estilo".

Agora, se você tem um diretório de importação no "novo estilo", você carrega todas as DLLs, usa o ponteiro de diretório IMAGE_DIRECTORY_ENTRY_BOUND_IMPORT para achar o IMAGE_BOUND_IMPORT_DESCRIPTOR, rastreia o mesmo e checa se os 'TimeDateStamp' das DLLs carregadas conferem com as indicadas neste diretório. Se não, acerte-as no array do 'FirstThunk'do diretório de importação.

#### Recursos

Os recursos (resources) como caixas de diálogo, menus, ícones e assim por diante são armazenados no diretório de dados apontado pelo IMAGE_DIRECTORY_ENTRY_RESOURCE. Está numa seção que tem pelo menos os bits 'IMAGE_SCN_CNT_INITIALIZED_DATA' e 'IMAGE_SCN_MEM_READ' setados.

Uma base de recursos é o 'IMAGE_RESOURCE_DIRECTORY' que contém várias 'IMAGE_RESOURCE_DIRECTORY_ENTRY', cada uma das quais, por sua vez, pode apontar para um 'IMAGE_RESOURCE_DIRECTORY'. Desta forma obtém-se uma árvore de 'IMAGE_RESOURCE_DIRECTORY' com 'IMAGE_RESOURCE_DIRECTORY-ENTRY' como folhas. Estas folhas apontam para os dados de recursos propriamente ditos.

Na vida real a situação é um tanto tranquila. Você normalmente não vai encontrar árvores complexas, difíceis de serem analisadas.

A hierarquia geralmente é a seguinte: um diretório é o raiz. Ele aponta para diretórios, um para cada tipo de recurso. Estes últimos apontam para subdiretórios, cada um deles com um nome ou ID, e que apontam para um diretório das línguas disponíveis para este recurso. Para cada língua há uma entrada de recurso, a qual, finalmente, vai apontar os dados. (Observe que recursos multi-língua não funcionam no Win95, que sempre usa o mesmo recurso se estiver disponível em várias línguas - Não testei qual, mas imagino que seja o primeiro que ele encontrar. Funciona no NT.)

A árvore, sem o ponteiro para os dados, tem o seguinte aspecto:

                           raiz
      -----------------------------------------------
      |                     |                       |
     menu                dialog                    icon
   ---------          ------------         -------------------
   |       |          |          |         |        |        |
 main     popup      0x10     maindlg    0x100    0x110    0x120
   |       |          |          |         |        |        |
english  português  default  português  default  default  default

Um IMAGE_RESOURCE_DIRECTORY compõe-se de:

* 32 bits de flags não utilizadas denominadas 'Characteristics'
* 32 bits para 'TimeDateStamp' (novamente na representação time_t) que indica a data e hora da criação do recurso (se a entrada estiver setada)
* 16 bits para 'MajorVersion' e 16 bits para 'MinorVersion', permitindo a manutenção de várias versões do recurso
* 16 bits para 'NumberOfNamedEntries' e outros 16 bits para 'NumberOfIdEntries'

Logo após esta estrutura ficam as estruturas 'NumberOfNamedEntries' + 'NumberOfIdEntries' que estão no formato 'IMAGE_RESOURCE_DIRECTORY_ENTRY', as nominadas constando primeiro. Podem apontar para outros 'IMAGE_RESOURCE_DIRECTORY' ou apontam diretamente para os dados de recurso.

Uma 'IMAGE_RESOURCE_DIRECTORY_ENTRY' consiste de:

* 32 bits com a id do recurso ou o diretório que o descreve
* 32 bits com o offset para os dados ou o offset para o próximo subdiretório

O significado da id depende do nível na árvore. A id pode ser um número (se o bit mais significante for zero) ou um nome (se o bit mais significante estiver setado). Se for um nome, os 31 bits restantes são o offset do início dos dados da seção de recursos até o nome (o nome tem o comprimento de 16 bits e trailing wide characters, em unicode, não terminado em 0).

Se você estiver no diretório raiz, a id, se for um número, indica o tipo de recurso:

1. cursor
2. bitmap
3. ícone
4. menu
5. diálogo
6. tabela de strings
7. diretório de fontes
8. fonte
9. aceleradores
10. dados não formatados de recursos
11. tabela de mensagens
12. grupo de cursor
13. grupo de ícones
14. informação da versão

Qualquer outro número é definido pelo usuário. Qualquer tipo de recurso (resourece-type) com um tipo de nome (type-name) é sempre definido pelo usuário.

Se você estiver um nível abaixo, a id é a id do recurso (ou nome do recurso).

Se você estiver mais um nível abaixo, a id precisa ser um número e é a id de língua da instância específica do recurso. Por exemplo, pode haver o mesmo diálogo em inglês australiano, francês canadense e alemão suiço, todos eles dividem a mesma id de recurso. O sistema irá escolher o diálogo que deve ser carregado baseado no locale do thread, o qual, por sua vez, usualmente reflete a "configuração regional" do usuário. (Se o recurso não puder ser encontrado para o locale thread, o sistema primeiro tentará achar um recurso para o locale usando uma sublíngua neutra, por exemplo, vai procurar o francês padrão ao invés do francês canadense do usuário; se ainda assim não consegue achar, a instância com a menor id de língua será usada. Tudo isto funciona apenas no NT).

Para decifrar a id da língua, divida-a na id da língua primária e na id da sublíngua usando as macros PRIMARYLANGID() e SUBLANGID() que fornecerão bits de 0 a 9 e de 10 a 15, respectivamente. Os valores estão definidos no arquivo "winresrc.h".

Recursos de língua só são apoiados para aceleradores, diálogos, menus, rcdata ou tabelas de strings (stringtables). Outros tipos de recursos deverão ser LANG_NEUTRAL/SUBLANG_NEUTRAL.

Para descobrir se o nível abaixo de um diretório de recursos é outro diretório, inspecione o bit mais significativo do offset. Se estiver setado (valor 1), os 31 bits restantes são o offset do início dos dados da seção de recursos até o próximo diretório, novamente no formato IMAGE_RESOURCE_DIRECTORY com entradas IMAGE_RESOURCE_ENTRYs.

Se o bit estiver re-setado (valor 0), o offset é a distância entre o início dos dados da seção de recursos e a descrição dos dados, uma IMAGE_RESOURCE_DATA_ENTRY. Consiste de 32 bits 'OffsetToData' (o offset para os dados contando do início dos dados da seção de recursos), 32 bits para o tamanho ('Size' ) dos dados, 32 bits 'Code Page' e 32 bits não utilizados.

(O uso de codepages não é recomendado. Deve-se dar preferência para 'language' - maneira mais adequada para apoiar múltiplos locales.)

O formato dos dados depende do tipo de recurso. Descrições podem ser encontradas na documentação do MS SDK. Note que qualquer string de recurso está sempre em UNICODE, exceto nos recursos definidos pelo usuário, onde estão no formato escolhido pelo usuário.

#### Remanejamentos

O último diretório de dados que será descrito é o diretório da base de remanejamento (base relocation directory). Ele é apontado por uma entrada IMAGE_DIRECTORY_ENTRY_BASERELOC nos diretórios de dados do cabeçalho opcional. Tipicamente fica contida numa seção própria, com um nome do tipo ".reloc" e os bits IMAGE_SCN_CNT_INITIALIZED_DATA, IMAGE_SCN_MEM_DISCARDABLE e IMAGE_SCN_MEM_READ setados.

Os dados de remanejamento são necessários para o carregador caso a imagem não possa ser mapeada para o endereço de carregamento preferencial 'ImageBase' mencionado no cabeçalho opcional. Neste caso, os endereços fixos fornecidos pelo linker deixam de ser válidos e o carregador precisa fazer correções nos endereços absolutos usados para a localização de variáveis estáticas, string literais e assim por diante.

O diretório de remanejamentos é uma sequência de blocos (chunks). Cada bloco contém a informação de remanejamento para 4 Kb da imagem. Todo bloco começa com uma estrutura 'IMAGE_BASE_RELOCATION'. Esta estrutura consiste em 32 bits para a 'VirtualAddress' e 32 bits para o 'SizeOfBlock', seguidos pelos dados de remanejamento, cada um com 16 bits.

O 'VirtualAddress' é o RVA base que precisa ser aplicado no remanejamento deste bloco. O 'SizeOfBlock' é o tamanho do bloco inteiro em bytes.

O número de remanejamentos de preenchimento é ('SizeOfBlock' - sizeof(IMAGE_BASE_RELOCATION)) / 2. A informação de remanejamento termina com uma estrutura IMAGE_BASE_RELOCATION com um 'VirtualAddress' de 0.

Cada 16 bits de informação de remanejamento consiste da posição de remanejamento nos 12 bits menos significativos e o tipo de remanejamento nos 4 bits mais significativos. Para obter o RVA do remanejamento precisa-se adicionar à 'VirtualAddress' da IMAGE_BASE_RELOCATION os 12 bits de posição. O tipo é um dos seguintes:

* IMAGE_REL_BASED_ABSOLUTE (0): Isto é um no-op (não operacional). É usado para alinhar o bloco numa borda de 32 bits. A posição deve ser 0.

* IMAGE_REL_BASED_HIGH (1): Os 16 bits mais significativos do remanejamento precisam ser aplicados aos 16 bits do WORD apontado pelo offset, o qual é o word mais significativo de um DWORD de 32 bits.

* IMAGE_REL_BASED_LOW (2): Os 16 bits menos significativos do remanejamento precisam ser aplicados aos 16 bits do WORD apontado pelo offset, o qual é o word menos significativo de um DWORD de 32 bits.

* IMAGE_REL_BASED_HIGHLOW (3): Todos os 32 bits do remanejamento precisam ser aplicados aos 32 bits em questão. Isto (e o no-op '0') é o único remanejamento que encontrei até agora em binários.

* IMAGE_REL_BASED_HIGHADJ (4): Este é só para os corajosos. Leia você mesmo (na referência bibliográfica [6]) e veja se consegue entender:
"Highadjust. Esta correção requer um valor completo de 32 bits. Os 16 bits mais significativos estão localizados em Offset e os 16 bits menos significativos estão localizados no próximo elemento do array Offset (este elemento de array está incluído on campo Size). Ambos precisam ser combinados numa variável com sinal. Adicione o delta de 32 bits. Depois adicione 0x8000 e armazene os 16 bits mais significativos da variável com sinal no campo de 16 bits em Offset."

* IMAGE_REL_BASED_MIPS_JMPADDR (5): Desconhecido

* IMAGE_REL_BASED_SECTION (6): Desconhecido

* IMAGE_REL_BASED_REL32 (7): Desconhecido

Como um exemplo, se você verificar que as informações de remanejamento são

0x00004000     32 bits     RVA inicial
0x00000010     32 bits     tamanho do bloco
0x3012         16 bits     dados para remanejamento
0x3080         16 bits     dados para remanejamento
0x30F6         16 bits     dados para remanejamento
0x0000         16 bits     dados para remanejamento
0x00000000                 (RVA do próximo bloco)
0xFF341234| | 

você sabe que o primeiro bloco descreve remanejamentos iniciando no RVA 0x4000 e tem o comprimento de 16 bytes. Como o cabeçalho usa 8 bytes e um remanejamento usa 2 bytes, há (16 - 8) / 2 = 4 remanejamentos no bloco.

O primeiro remanejamento deve ser aplicado no DWORD em 0x4012, o próximo no DWORD em 0x4080 e o terceiro no DWORD em 0x40F6. O último remanejamento é no-op.

O próximo bloco tem um RVA de 0 e termina a lista.

Agora, como é que se faz um remanejamento?

Sabe-se que a imagem é remanejada para o endereço preferencial de mapeamento 'ImageBase' do cabeçalho opcional. Também se conhece o endereço para onde a imagem foi mapeada. Se ambos coincidem, nada precisa ser feito. Se não coincidem, calcula-se a diferença base_atual - base_preferencial e adiciona-se este valor (com sinal, pois pode ser negativo) às posições de remanejamento, as quais são localizadas de acordo com o método descrito acima.

#### Exercícios propostos

Para este módulo, tente o seguinte:

1. Identifique as DLLs usadas no programa exemplo
2. Identifique as funções que são importadas das DLLs


### Referências

Encontrei vários textos e artigos na web a respeito do formato PE. Alguns abordando parcialmente o assunto, outros com informações erradas, a maioria confusos e desestruturados. Para um assunto tão complexo é preciso um pouco mais do que costurar algumas informações esparsas, é preciso um conhecimento básico muito sólido, além de muita experiência e critério. Estava quase desistindo quando esbarrei no texto de LUEVELSMEYER, no site dos UnpackingGods.

$Id: pe.txt,v 1.9 1999/03/20 23:55:09 LUEVELSMEYER Exp $, assim este texto está identificado.

Revelando uma pesquisa aprofundada e uma intensa contribuição pessoal, Luevelsmeyer não economizou em explicações e exemplos. Sei que é um texto extremamente técnico, extenuante até mesmo para os profissionais da área, MAS VALEU A PENA! É claro que dificilmente alguém guarda todas estas informações de cabeça (só doidjo mesmo), mas os princípios básicos ficam totalmente elucidados. Enquanto o formato PE não for modificado ou abandonado, o texto é uma referência preciosa.

Imaginei que devem existir muitos interessados no assunto que eventualmente não possuam conhecimentos de Inglês suficientes para poder aproveitar todo o conteúdo do texto, então... tomei a liberdade de traduzi-lo para o Português - infelizmente sem a autorização do autor. Além disto, não pude resistir e acabei enxertando informações da minha experiência e pesquisa pessoal.

#### Outras fontes de pesquisa

[1] "Peering Inside the PE: A Tour of the Win32 Portable Executable File Format" (M. Pietrek), em: Microsoft Systems Journal 3/1994

[2] "Why to Use _declspec(dllimport) & _declspec(dllexport) In Code", MS Knowledge Base Q132044

[3] "Windows Q&A" (M. Pietrek), in: Microsoft Systems Journal 8/1995

[4] "Writing Multiple-Language Resources", MS Knowledge Base Q89866

[5] "The Portable Executable File Format from Top to Bottom" (Randy Kath), em: Microsoft Developer Network

[6] Tool Interface Standard (TIS) Formats Specification for Windows Version 1.0 (Intel Order Number 241597, Intel Corporation 1993)
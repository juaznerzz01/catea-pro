const BRAZILIAN_CITIES = [
  { label: "Brasil inteiro", city: "", state: "" },

  // Acre
  { label: "Rio Branco", city: "Rio Branco", state: "AC" },
  { label: "Cruzeiro do Sul", city: "Cruzeiro do Sul", state: "AC" },

  // Alagoas
  { label: "Maceió", city: "Maceió", state: "AL" },
  { label: "Arapiraca", city: "Arapiraca", state: "AL" },

  // Amapá
  { label: "Macapá", city: "Macapá", state: "AP" },
  { label: "Santana", city: "Santana", state: "AP" },

  // Amazonas
  { label: "Manaus", city: "Manaus", state: "AM" },
  { label: "Parintins", city: "Parintins", state: "AM" },

  // Bahia
  { label: "Salvador", city: "Salvador", state: "BA" },
  { label: "Feira de Santana", city: "Feira de Santana", state: "BA" },
  { label: "Vitória da Conquista", city: "Vitória da Conquista", state: "BA" },
  { label: "Camaçari", city: "Camaçari", state: "BA" },
  { label: "Itabuna", city: "Itabuna", state: "BA" },
  { label: "Juazeiro", city: "Juazeiro", state: "BA" },
  { label: "Lauro de Freitas", city: "Lauro de Freitas", state: "BA" },
  { label: "Ilhéus", city: "Ilhéus", state: "BA" },
  { label: "Jequié", city: "Jequié", state: "BA" },
  { label: "Barreiras", city: "Barreiras", state: "BA" },

  // Ceará
  { label: "Fortaleza", city: "Fortaleza", state: "CE" },
  { label: "Caucaia", city: "Caucaia", state: "CE" },
  { label: "Juazeiro do Norte", city: "Juazeiro do Norte", state: "CE" },
  { label: "Maracanaú", city: "Maracanaú", state: "CE" },
  { label: "Sobral", city: "Sobral", state: "CE" },

  // Distrito Federal
  { label: "Brasília", city: "Brasília", state: "DF" },

  // Espírito Santo
  { label: "Vitória", city: "Vitória", state: "ES" },
  { label: "Vila Velha", city: "Vila Velha", state: "ES" },
  { label: "Serra", city: "Serra", state: "ES" },
  { label: "Cariacica", city: "Cariacica", state: "ES" },
  { label: "Cachoeiro de Itapemirim", city: "Cachoeiro de Itapemirim", state: "ES" },
  { label: "Linhares", city: "Linhares", state: "ES" },

  // Goiás
  { label: "Goiânia", city: "Goiânia", state: "GO" },
  { label: "Aparecida de Goiânia", city: "Aparecida de Goiânia", state: "GO" },
  { label: "Anápolis", city: "Anápolis", state: "GO" },
  { label: "Rio Verde", city: "Rio Verde", state: "GO" },
  { label: "Luziânia", city: "Luziânia", state: "GO" },

  // Maranhão
  { label: "São Luís", city: "São Luís", state: "MA" },
  { label: "Imperatriz", city: "Imperatriz", state: "MA" },
  { label: "Timon", city: "Timon", state: "MA" },
  { label: "Caxias", city: "Caxias", state: "MA" },

  // Mato Grosso
  { label: "Cuiabá", city: "Cuiabá", state: "MT" },
  { label: "Várzea Grande", city: "Várzea Grande", state: "MT" },
  { label: "Rondonópolis", city: "Rondonópolis", state: "MT" },
  { label: "Sinop", city: "Sinop", state: "MT" },
  { label: "Tangará da Serra", city: "Tangará da Serra", state: "MT" },

  // Mato Grosso do Sul
  { label: "Campo Grande", city: "Campo Grande", state: "MS" },
  { label: "Dourados", city: "Dourados", state: "MS" },
  { label: "Três Lagoas", city: "Três Lagoas", state: "MS" },
  { label: "Corumbá", city: "Corumbá", state: "MS" },

  // Minas Gerais
  { label: "Belo Horizonte", city: "Belo Horizonte", state: "MG" },
  { label: "Uberlândia", city: "Uberlândia", state: "MG" },
  { label: "Contagem", city: "Contagem", state: "MG" },
  { label: "Juiz de Fora", city: "Juiz de Fora", state: "MG" },
  { label: "Betim", city: "Betim", state: "MG" },
  { label: "Montes Claros", city: "Montes Claros", state: "MG" },
  { label: "Ribeirão das Neves", city: "Ribeirão das Neves", state: "MG" },
  { label: "Uberaba", city: "Uberaba", state: "MG" },
  { label: "Governador Valadares", city: "Governador Valadares", state: "MG" },
  { label: "Ipatinga", city: "Ipatinga", state: "MG" },
  { label: "Sete Lagoas", city: "Sete Lagoas", state: "MG" },
  { label: "Divinópolis", city: "Divinópolis", state: "MG" },
  { label: "Santa Luzia", city: "Santa Luzia", state: "MG" },
  { label: "Poços de Caldas", city: "Poços de Caldas", state: "MG" },

  // Pará
  { label: "Belém", city: "Belém", state: "PA" },
  { label: "Ananindeua", city: "Ananindeua", state: "PA" },
  { label: "Santarém", city: "Santarém", state: "PA" },
  { label: "Marabá", city: "Marabá", state: "PA" },
  { label: "Parauapebas", city: "Parauapebas", state: "PA" },
  { label: "Castanhal", city: "Castanhal", state: "PA" },

  // Paraíba
  { label: "João Pessoa", city: "João Pessoa", state: "PB" },
  { label: "Campina Grande", city: "Campina Grande", state: "PB" },
  { label: "Santa Rita", city: "Santa Rita", state: "PB" },
  { label: "Patos", city: "Patos", state: "PB" },

  // Paraná
  { label: "Curitiba", city: "Curitiba", state: "PR" },
  { label: "Londrina", city: "Londrina", state: "PR" },
  { label: "Maringá", city: "Maringá", state: "PR" },
  { label: "Ponta Grossa", city: "Ponta Grossa", state: "PR" },
  { label: "Cascavel", city: "Cascavel", state: "PR" },
  { label: "São José dos Pinhais", city: "São José dos Pinhais", state: "PR" },
  { label: "Foz do Iguaçu", city: "Foz do Iguaçu", state: "PR" },
  { label: "Colombo", city: "Colombo", state: "PR" },
  { label: "Guarapuava", city: "Guarapuava", state: "PR" },
  { label: "Paranaguá", city: "Paranaguá", state: "PR" },

  // Pernambuco
  { label: "Recife", city: "Recife", state: "PE" },
  { label: "Jaboatão dos Guararapes", city: "Jaboatão dos Guararapes", state: "PE" },
  { label: "Olinda", city: "Olinda", state: "PE" },
  { label: "Caruaru", city: "Caruaru", state: "PE" },
  { label: "Petrolina", city: "Petrolina", state: "PE" },
  { label: "Paulista", city: "Paulista", state: "PE" },
  { label: "Cabo de Santo Agostinho", city: "Cabo de Santo Agostinho", state: "PE" },

  // Piauí
  { label: "Teresina", city: "Teresina", state: "PI" },
  { label: "Parnaíba", city: "Parnaíba", state: "PI" },

  // Rio de Janeiro
  { label: "Rio de Janeiro", city: "Rio de Janeiro", state: "RJ" },
  { label: "São Gonçalo", city: "São Gonçalo", state: "RJ" },
  { label: "Duque de Caxias", city: "Duque de Caxias", state: "RJ" },
  { label: "Nova Iguaçu", city: "Nova Iguaçu", state: "RJ" },
  { label: "Niterói", city: "Niterói", state: "RJ" },
  { label: "Belford Roxo", city: "Belford Roxo", state: "RJ" },
  { label: "Campos dos Goytacazes", city: "Campos dos Goytacazes", state: "RJ" },
  { label: "São João de Meriti", city: "São João de Meriti", state: "RJ" },
  { label: "Petrópolis", city: "Petrópolis", state: "RJ" },
  { label: "Volta Redonda", city: "Volta Redonda", state: "RJ" },
  { label: "Magé", city: "Magé", state: "RJ" },
  { label: "Macaé", city: "Macaé", state: "RJ" },
  { label: "Angra dos Reis", city: "Angra dos Reis", state: "RJ" },
  { label: "Cabo Frio", city: "Cabo Frio", state: "RJ" },

  // Rio Grande do Norte
  { label: "Natal", city: "Natal", state: "RN" },
  { label: "Mossoró", city: "Mossoró", state: "RN" },
  { label: "Parnamirim", city: "Parnamirim", state: "RN" },

  // Rio Grande do Sul
  { label: "Porto Alegre", city: "Porto Alegre", state: "RS" },
  { label: "Caxias do Sul", city: "Caxias do Sul", state: "RS" },
  { label: "Pelotas", city: "Pelotas", state: "RS" },
  { label: "Canoas", city: "Canoas", state: "RS" },
  { label: "Santa Maria", city: "Santa Maria", state: "RS" },
  { label: "Gravataí", city: "Gravataí", state: "RS" },
  { label: "Viamão", city: "Viamão", state: "RS" },
  { label: "Novo Hamburgo", city: "Novo Hamburgo", state: "RS" },
  { label: "São Leopoldo", city: "São Leopoldo", state: "RS" },
  { label: "Rio Grande", city: "Rio Grande", state: "RS" },
  { label: "Alvorada", city: "Alvorada", state: "RS" },
  { label: "Passo Fundo", city: "Passo Fundo", state: "RS" },

  // Rondônia
  { label: "Porto Velho", city: "Porto Velho", state: "RO" },
  { label: "Ji-Paraná", city: "Ji-Paraná", state: "RO" },

  // Roraima
  { label: "Boa Vista", city: "Boa Vista", state: "RR" },

  // Santa Catarina
  { label: "Florianópolis", city: "Florianópolis", state: "SC" },
  { label: "Joinville", city: "Joinville", state: "SC" },
  { label: "Blumenau", city: "Blumenau", state: "SC" },
  { label: "São José", city: "São José", state: "SC" },
  { label: "Chapecó", city: "Chapecó", state: "SC" },
  { label: "Criciúma", city: "Criciúma", state: "SC" },
  { label: "Itajaí", city: "Itajaí", state: "SC" },
  { label: "Jaraguá do Sul", city: "Jaraguá do Sul", state: "SC" },
  { label: "Balneário Camboriú", city: "Balneário Camboriú", state: "SC" },
  { label: "Lages", city: "Lages", state: "SC" },

  // São Paulo
  { label: "São Paulo", city: "São Paulo", state: "SP" },
  { label: "Guarulhos", city: "Guarulhos", state: "SP" },
  { label: "Campinas", city: "Campinas", state: "SP" },
  { label: "São Bernardo do Campo", city: "São Bernardo do Campo", state: "SP" },
  { label: "Santo André", city: "Santo André", state: "SP" },
  { label: "Osasco", city: "Osasco", state: "SP" },
  { label: "São José dos Campos", city: "São José dos Campos", state: "SP" },
  { label: "Ribeirão Preto", city: "Ribeirão Preto", state: "SP" },
  { label: "Sorocaba", city: "Sorocaba", state: "SP" },
  { label: "Santos", city: "Santos", state: "SP" },
  { label: "São José do Rio Preto", city: "São José do Rio Preto", state: "SP" },
  { label: "Mogi das Cruzes", city: "Mogi das Cruzes", state: "SP" },
  { label: "Diadema", city: "Diadema", state: "SP" },
  { label: "Jundiaí", city: "Jundiaí", state: "SP" },
  { label: "Piracicaba", city: "Piracicaba", state: "SP" },
  { label: "Mauá", city: "Mauá", state: "SP" },
  { label: "Bauru", city: "Bauru", state: "SP" },
  { label: "Carapicuíba", city: "Carapicuíba", state: "SP" },
  { label: "Itaquaquecetuba", city: "Itaquaquecetuba", state: "SP" },
  { label: "São Vicente", city: "São Vicente", state: "SP" },
  { label: "Franca", city: "Franca", state: "SP" },
  { label: "Praia Grande", city: "Praia Grande", state: "SP" },
  { label: "Guarujá", city: "Guarujá", state: "SP" },
  { label: "Taubaté", city: "Taubaté", state: "SP" },
  { label: "Limeira", city: "Limeira", state: "SP" },
  { label: "Suzano", city: "Suzano", state: "SP" },
  { label: "Taboão da Serra", city: "Taboão da Serra", state: "SP" },
  { label: "Sumaré", city: "Sumaré", state: "SP" },
  { label: "Barueri", city: "Barueri", state: "SP" },
  { label: "Embu das Artes", city: "Embu das Artes", state: "SP" },
  { label: "Indaiatuba", city: "Indaiatuba", state: "SP" },
  { label: "Cotia", city: "Cotia", state: "SP" },
  { label: "Americana", city: "Americana", state: "SP" },
  { label: "Marília", city: "Marília", state: "SP" },
  { label: "Araraquara", city: "Araraquara", state: "SP" },
  { label: "Presidente Prudente", city: "Presidente Prudente", state: "SP" },
  { label: "Jacareí", city: "Jacareí", state: "SP" },
  { label: "Hortolândia", city: "Hortolândia", state: "SP" },

  // Sergipe
  { label: "Aracaju", city: "Aracaju", state: "SE" },
  { label: "Nossa Senhora do Socorro", city: "Nossa Senhora do Socorro", state: "SE" },

  // Tocantins
  { label: "Palmas", city: "Palmas", state: "TO" },
  { label: "Araguaína", city: "Araguaína", state: "TO" },
];

export default BRAZILIAN_CITIES;

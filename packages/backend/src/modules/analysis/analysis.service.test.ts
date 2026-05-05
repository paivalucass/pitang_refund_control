import { calculateConfiabilityScore, extractEntities } from "./analysis.service.ts";

describe("analysis.service", () => {
  it("extracts Brazilian currency values and dates from receipt text", () => {
    const result = extractEntities(`
      Restaurante Pitang
      Data: 01/05/2026
      Total R$ 1.234,56
    `);

    expect(result.amount).toBe(1234.56);
    expect(result.expenseDate).toBe("2026-05-01");
  });

  it("does not confuse CPF or CNPJ fragments with receipt totals during autocomplete", () => {
    const result = extractEntities(`
      BRAZZETUS BOA VIAGEM
      CNPJ 12.345.678/0001-99
      CPF Consumidor 123.456.789-10
      Total R$ 149,90
    `);

    expect(result.amount).toBe(149.9);
  });

  it("only matches the submitted amount during manager analysis", () => {
    const result = extractEntities(
      `
        CNPJ 12.345.678/0001-99
        Subtotal R$ 120,00
        Total R$ 149,90
      `,
      { expectedAmount: 149.9 }
    );

    expect(result.amount).toBe(149.9);
  });

  it("does not infer an amount from document identifiers without money context", () => {
    const result = extractEntities(`
      CNPJ 12.345.678/0001-99
      CPF 123.456.789-10
    `);

    expect(result.amount).toBeUndefined();
  });

  it("infers category and description from category-related keywords", () => {
    const result = extractEntities(`
      Uber do Brasil Tecnologia
      Corrida para visita tecnica
      Total R$ 42,80
    `);

    expect(result.categoryName).toBe("Transporte");
    expect(result.description).toBe("Despesa de transporte - Uber");
    expect(result.matchedKeywords).toEqual(expect.arrayContaining(["uber", "corrida"]));
  });

  it("extracts the receipt phrase that best matches the submitted description", () => {
    const result = extractEntities(
      `
        BRAZZETUS BOA VIAGEM
        Restaurante e churrascaria
        CNPJ 00.000.000/0001-00
        Total R$ 149,90
      `,
      "Brazzettus almoço firma"
    );

    expect(result.description).toContain("BRAZZETUS");
    expect(result.descriptionMatchScore).toBe(1);
    expect(result.categoryName).toBe("Alimentação");
  });

  it("gives full description compatibility when the submitted merchant appears in the document", async () => {
    const result = await calculateConfiabilityScore(
      extractEntities(
        `
          BRAZZETUS BOA VIAGEM
          Restaurante e churrascaria
          Data 01/05/2026
          Total R$ 149,90
        `,
        "Brazzettus almoço firma"
      ),
      {
        amount: 149.9,
        expenseDate: "2026-05-01",
        description: "Brazzettus almoço firma",
        categoryName: "Alimentação",
      }
    );

    expect(result.matches.descriptionSimilarity).toBe(1);
    expect(result.score).toBe(100);
  });

  it("calculates the confiability score from amount, date and description similarity", async () => {
    const result = await calculateConfiabilityScore(
      {
        text: "Almoço com cliente no restaurante Pitang",
        amount: 120,
        expenseDate: "2026-05-01",
        description: "Almoço com cliente no restaurante Pitang",
      },
      {
        amount: 120,
        expenseDate: "2026-05-01",
        description: "Almoço com cliente no restaurante Pitang",
        categoryName: "Alimentação",
      }
    );

    expect(result.matches.amount).toBe(true);
    expect(result.matches.expenseDate).toBe(true);
    expect(result.matches.descriptionSimilarity).toBeGreaterThan(0.69);
    expect(result.score).toBeGreaterThan(89);
  });
});

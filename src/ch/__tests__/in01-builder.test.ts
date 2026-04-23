import { describe, expect, it } from "vitest";

import { buildSoloIn01, type SoloIn01Input } from "../in01-builder.js";

const sample: SoloIn01Input = {
  companyName: "Orca Design",
  sicCode: "62012",
  registeredOffice: {
    premise: "Office 1.01",
    street: "411 Oxford Street",
    postTown: "London",
    postcode: "W1C 2PE",
    country: "GB-ENG",
  },
  director: {
    title: "Mr",
    forename: "John",
    surname: "Donn",
    dateOfBirth: "1988-05-12",
    nationality: "British",
    countryOfResidence: "United Kingdom",
    residentialAddress: {
      premise: "45",
      street: "King's Road",
      postTown: "London",
      postcode: "SW3 4UH",
      country: "GB",
    },
    personalCode: "TEST000001A",
  },
  registeredEmail: "noreply@qpayments.co.uk",
};

describe("IN01 builder", () => {
  it("wraps the company name with LTD suffix and uppercases it", () => {
    const xml = buildSoloIn01(sample);
    expect(xml).toContain("<CompanyName>ORCA DESIGN LTD</CompanyName>");
  });

  it("embeds the director's personal code in Appointments, Subscribers, and PSC blocks", () => {
    const xml = buildSoloIn01(sample);
    const matches = xml.match(/<PersonalCode>TEST000001A<\/PersonalCode>/g);
    expect(matches?.length).toBeGreaterThanOrEqual(3);
  });

  it("allocates 100 Ordinary shares at £1 each, fully paid", () => {
    const xml = buildSoloIn01(sample);
    expect(xml).toContain("<NumberOfShares>100</NumberOfShares>");
    expect(xml).toContain("<ClassOfShares>ORDINARY</ClassOfShares>");
    expect(xml).toContain("<AmountUnpaidPerShare>0.00</AmountUnpaidPerShare>");
  });

  it("defaults to Model Articles and England & Wales jurisdiction", () => {
    const xml = buildSoloIn01(sample);
    expect(xml).toContain("<ArticlesType>MODEL</ArticlesType>");
    expect(xml).toContain("<JurisdictionCode>EW</JurisdictionCode>");
  });

  it("declares the three statutory statements as true", () => {
    const xml = buildSoloIn01(sample);
    expect(xml).toContain("<LawfulPurposeStatement>true</LawfulPurposeStatement>");
    expect(xml).toContain("<ConsentToActStatement>true</ConsentToActStatement>");
    expect(xml).toContain("<PSCParticularsStatement>true</PSCParticularsStatement>");
  });
});

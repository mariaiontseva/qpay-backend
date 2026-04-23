import { create } from "xmlbuilder2";

/**
 * Minimal IN01 input for the MVP "solo founder" flow:
 *   · Private company limited by shares
 *   · England & Wales jurisdiction
 *   · Model Articles
 *   · 1 director (also the sole shareholder and PSC)
 *   · 100 Ordinary shares @ £1, fully paid
 *
 * Every non-standard branch (corporate directors, guarantee companies,
 * bespoke articles, RLE PSCs, secretaries, §243, …) is deliberately
 * excluded — those come later.
 */
export interface SoloIn01Input {
  /** Company name — do NOT include the "Ltd" suffix; we append it. */
  companyName: string;
  /** 5-digit SIC code (UK SIC 2007). */
  sicCode: string;
  /** Registered office — QPay London by default. */
  registeredOffice: {
    premise: string;
    street: string;
    postTown: string;
    postcode: string;
    country: "GB-ENG" | "GB-WLS" | "GB-SCT" | "GB-NIR";
  };
  /** Single director + shareholder + PSC. */
  director: {
    title: string;
    forename: string;
    surname: string;
    dateOfBirth: string; // YYYY-MM-DD
    nationality: string; // e.g. "British"
    countryOfResidence: string; // e.g. "United Kingdom"
    residentialAddress: {
      premise: string;
      street: string;
      postTown: string;
      postcode: string;
      country: "GB" | string;
    };
    /** 11-character CH personal code from GOV.UK One Login. */
    personalCode: string;
  };
  /** Registered email address (private, for CH correspondence). */
  registeredEmail: string;
}

/**
 * Render the IN01 XML body.
 *
 * The result is the *inner* XML that goes inside the GovTalk envelope's
 * <Body> element — do not wrap it further.
 */
export function buildSoloIn01(input: SoloIn01Input): string {
  const filedName = `${input.companyName.trim()} LTD`.toUpperCase();
  const d = input.director;

  const doc = create({ version: "1.0", encoding: "UTF-8" })
    .ele("CompanyIncorporation", {
      xmlns: "http://xmlgw.companieshouse.gov.uk/v2-1/schema/forms/IN01",
    })
      .ele("CompanyName").txt(filedName).up()
      .ele("CompanyType").txt("LTD").up()
      .ele("JurisdictionCode").txt("EW").up()
      .ele("RegisteredOffice")
        .ele("Premise").txt(input.registeredOffice.premise).up()
        .ele("Street").txt(input.registeredOffice.street).up()
        .ele("PostTown").txt(input.registeredOffice.postTown).up()
        .ele("Postcode").txt(input.registeredOffice.postcode).up()
        .ele("Country").txt(input.registeredOffice.country).up()
      .up()
      .ele("SICCodes")
        .ele("SICCode").txt(input.sicCode).up()
      .up()
      .ele("ArticlesType").txt("MODEL").up()
      .ele("RegisteredEmailAddress").txt(input.registeredEmail).up()
      .ele("Appointments")
        .ele("Director")
          .ele("PersonalCode").txt(d.personalCode).up()
          .ele("PersonName")
            .ele("Title").txt(d.title).up()
            .ele("Forename").txt(d.forename).up()
            .ele("Surname").txt(d.surname).up()
          .up()
          .ele("DateOfBirth").txt(d.dateOfBirth).up()
          .ele("Nationality").txt(d.nationality).up()
          .ele("CountryOfResidence").txt(d.countryOfResidence).up()
          .ele("ResidentialAddress")
            .ele("Premise").txt(d.residentialAddress.premise).up()
            .ele("Street").txt(d.residentialAddress.street).up()
            .ele("PostTown").txt(d.residentialAddress.postTown).up()
            .ele("Postcode").txt(d.residentialAddress.postcode).up()
            .ele("Country").txt(d.residentialAddress.country).up()
          .up()
          .ele("ConsentToAct").txt("true").up()
        .up()
      .up()
      .ele("StatementOfCapital")
        .ele("Totals")
          .ele("TotalNumberOfIssuedShares").txt("100").up()
          .ele("TotalAggregateNominalValue").txt("100.00").up()
          .ele("Currency").txt("GBP").up()
        .up()
        .ele("Shares")
          .ele("ShareClass")
            .ele("ClassOfShares").txt("ORDINARY").up()
            .ele("NumberOfShares").txt("100").up()
            .ele("NominalValuePerShare").txt("1.00").up()
            .ele("Currency").txt("GBP").up()
            .ele("PrescribedParticulars")
              .ele("VotingRights").txt("One vote per share").up()
              .ele("DividendRights").txt("Pro rata, discretionary").up()
              .ele("DistributionRights").txt("Pro rata on winding up").up()
            .up()
          .up()
        .up()
      .up()
      .ele("Subscribers")
        .ele("Subscriber")
          .ele("PersonalCode").txt(d.personalCode).up()
          .ele("PersonName")
            .ele("Title").txt(d.title).up()
            .ele("Forename").txt(d.forename).up()
            .ele("Surname").txt(d.surname).up()
          .up()
          .ele("SharesAllocated")
            .ele("NumberShares").txt("100").up()
            .ele("ShareClass").txt("ORDINARY").up()
            .ele("AmountPaidPerShare").txt("1.00").up()
            .ele("AmountUnpaidPerShare").txt("0.00").up()
          .up()
        .up()
      .up()
      .ele("PSCStatements")
        .ele("IndividualPSC")
          .ele("PersonalCode").txt(d.personalCode).up()
          .ele("NatureOfControl")
            .ele("OwnershipOfShares").txt("75_TO_100_PERCENT").up()
            .ele("OwnershipOfVotingRights").txt("75_TO_100_PERCENT").up()
          .up()
        .up()
      .up()
      .ele("Statements")
        .ele("LawfulPurposeStatement").txt("true").up()
        .ele("ConsentToActStatement").txt("true").up()
        .ele("PSCParticularsStatement").txt("true").up()
      .up()
    .up();

  return doc.end({ prettyPrint: false, headless: true });
}

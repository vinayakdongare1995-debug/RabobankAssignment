import { parseFile } from '../utils/parser';

function makeFile(content: string, name: string, type = 'text/plain'): File {
  return new File([content], name, { type });
}

describe('parser', () => {
  it('parses CSV into records', async () => {
    const csv = `Reference,Account Number,Description,Start Balance,Mutation,End Balance
1001,NLXX,Desc,10.00,+5.00,15.00
`;
    const file = makeFile(csv, 'sample.csv', 'text/csv');

    const recs = await parseFile(file);

    expect(recs.length).toBe(1);
    expect(recs[0].reference).toBe('1001');
    expect(recs[0].accountNumber).toBe('NLXX');
    expect(recs[0].startBalance).toBeCloseTo(10);
    expect(recs[0].endBalance).toBeCloseTo(15);
  });

  it('parses XML into records', async () => {
    const xml = `<records>
      <record reference="2001">
        <accountNumber>NL200</accountNumber>
        <description>Test</description>
        <startBalance>50.00</startBalance>
        <mutation>-10.00</mutation>
        <endBalance>40.00</endBalance>
      </record>
    </records>`;
    const file = makeFile(xml, 'sample.xml', 'application/xml');

    const recs = await parseFile(file);

    expect(recs.length).toBe(1);
    expect(recs[0].reference).toBe('2001');
    expect(recs[0].accountNumber).toBe('NL200');
    expect(recs[0].mutation).toBeCloseTo(-10);
  });

  it('parses CSV with special characters correctly', async () => {
    const csv = `Reference,Account Number,Description,Start Balance,Mutation,End Balance
3003,NL300,Subscription from Daniël Theuß,20.00,+5.00,25.00
`;
    const file = makeFile(csv, 'utf8-sample.csv', 'text/csv');

    const recs = await parseFile(file);

    expect(recs.length).toBe(1);
    expect(recs[0].description).toBe('Subscription from Daniël Theuß');
  });
});

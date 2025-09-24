import { render, screen } from '@testing-library/react';
import ReportTable from '../components/ReportTable';

describe('ReportTable', () => {
  it('renders nothing when errors is an empty array', () => {
    const { container } = render(<ReportTable errors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders rows for DUPLICATE_REFERENCE and INCORRECT_END_BALANCE errors', () => {
    const errors = [
      {
        type: 'DUPLICATE_REFERENCE',
        records: [
          {
            reference: '1001',
            accountNumber: 'NL91RABO0315273637',
            description: 'Duplicate record A',
            startBalance: 100,
            mutation: -20,
            endBalance: 80,
          },
          {
            reference: '1001',
            accountNumber: 'NL91RABO0315273637',
            description: 'Duplicate record B',
            startBalance: 100,
            mutation: -20,
            endBalance: 80,
          },
        ],
      },
      {
        type: 'INCORRECT_END_BALANCE',
        record: {
          reference: '2002',
          accountNumber: 'NL91RABO0315273638',
          description: 'Incorrect end bal',
          startBalance: 50,
          mutation: 10,
          endBalance: 70,
        },
      },
    ];

    render(<ReportTable errors={errors as any} />);
    expect(screen.getByTestId('validation-table')).toBeInTheDocument();

    const refs1001 = screen.getAllByText('1001');
    expect(refs1001.length).toBe(2);

    expect(screen.getByText('2002')).toBeInTheDocument();

    expect(screen.getAllByText(/Duplicate reference/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Incorrect end balance/).length).toBeGreaterThan(0);
  });

  it('merges messages when a record has both DUPLICATE_REFERENCE and INCORRECT_END_BALANCE', () => {
    const rec = {
      reference: '3003',
      accountNumber: 'ACC3003',
      description: 'Combined issue',
      startBalance: 10,
      mutation: 5,
      endBalance: 20,
    };

    const errors = [
      { type: 'DUPLICATE_REFERENCE', records: [rec] },
      { type: 'INCORRECT_END_BALANCE', record: rec },
    ];

    render(<ReportTable errors={errors as any} />);

    const row = screen.getByTestId(`row-${rec.reference}`);
    expect(row).toBeInTheDocument();

    expect(row).toHaveTextContent(/Duplicate reference/);
    expect(row).toHaveTextContent(/Incorrect end balance/);
  });

  it('sorts merged results by reference then accountNumber', () => {
    const invalidBalanceRecord1 = {
      reference: '100',
      accountNumber: 'AAA',
      description: 'First',
      startBalance: 0,
      mutation: 0,
      endBalance: 0,
    };
    const invalidBalanceRecord2 = {
      reference: '200',
      accountNumber: 'BBB',
      description: 'Second',
      startBalance: 0,
      mutation: 0,
      endBalance: 0,
    };

    const errors = [
      { type: 'INCORRECT_END_BALANCE', record: invalidBalanceRecord2 },
      { type: 'INCORRECT_END_BALANCE', record: invalidBalanceRecord1 },
    ];

    render(<ReportTable errors={errors as any} />);

    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.length).toBe(2);

    expect(rows[0]).toHaveTextContent('100');
    expect(rows[1]).toHaveTextContent('200');
  });

  it('handles DUPLICATE_REFERENCE with non-array records gracefully', () => {
    const singleRec = {
      reference: '4004',
      accountNumber: 'ACC4004',
      description: 'Single object duplicate',
      startBalance: 0,
      mutation: 0,
      endBalance: 0,
    };

    const errors = [
      {
        type: 'DUPLICATE_REFERENCE',
        records: singleRec as any,
      },
    ];

    render(<ReportTable errors={errors as any} />);

    const row = screen.getByTestId(`row-${singleRec.reference}`);
    expect(row).toBeInTheDocument();
    expect(row).toHaveTextContent('4004');
    expect(row).toHaveTextContent(/Duplicate reference/);
  });
});

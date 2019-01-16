import React from "react";
import styled, { css } from "styled-components";
import ConditionalWrap from "conditional-wrap";
import {
  Flex,
  Box,
  Heading as RebassHeading,
  Link as RebassLink
} from "rebass";
import Link from "../components/Link";

import BoxShadow from "./BoxShadow";

const Row = styled(Flex)`
  &:hover ${RebassHeading} {
    text-decoration: underline;
  }
`;

const Td = styled.td`
  ${props => props.textAlign && `text-align: ${props.textAlign}`};
  ${props => props.padding && `padding: ${props.padding}`};

  ${RebassLink} {
    display: block;
    padding: 8px 0;

    &:hover {
      text-decoration: none;
    }
  }
`;

const Cell = props => (
  <Td textAlign={props.textAlign} padding={props.padding}>
    <ConditionalWrap
      condition={!!props.href}
      wrap={children => <Link href={props.href}>{children}</Link>}
    >
      {props.children || null}
    </ConditionalWrap>
  </Td>
);

const RowLink = styled(Link)`
  border-bottom: 1px solid #eee;

  &:last-of-type {
    border-bottom: none;
  }

  &:hover ${RebassHeading} {
    text-decoration: underline;
  }
`;

// $FlowIssue ref https://github.com/facebook/flow/issues/6308
type RowType = *;

type Props = {
  rows: Array<RowType>,
  render: (row: RowType) => React$Node,
  keyField?: string
};

const Table = (props: Props) => (
  <Flex width={1}>
    <BoxShadow hoverShadow="none" width={1}>
      <Flex
        flexDirection="column"
        bg="#fff"
        css={{ borderRadius: "5px", border: "1px solid #eee" }}
        width={1}
      >
        {props.rows.map(row => (
          <RowLink
            py={3}
            px={3}
            key={
              typeof props.keyField === "string" ? row[props.keyField] : row.id
            }
            href={row.href}
            underline={false}
          >
            <Flex flexDirection={["column", "row"]}>{props.render(row)}</Flex>
          </RowLink>
        ))}
      </Flex>
    </BoxShadow>
  </Flex>
);

export default Table;

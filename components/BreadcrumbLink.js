import styled from "styled-components";
import { Box } from "rebass";
import { TextButton } from "./Button";
import Text from "./Text";
import Icon from "./Icon";
import Link from "./Link";

const BreadcrumbLinkWrapper = styled(Box)`
  ${Icon} {
    transition: transform 50ms ease-in-out;
  }

  &:hover ${Icon} {
    transform: translateX(-4px);
  }
`;

type Props = {
  href: string,
  children: React$Node,
  mt?: number,
  color?: string
};

const BreadcrumbLink = (props: Props) => (
  <BreadcrumbLinkWrapper mt={props.mt}>
    <TextButton as={Link} href={props.href}>
      <Text as="div" color={props.color} fontSize={1}>
        {props.children}
      </Text>
    </TextButton>
  </BreadcrumbLinkWrapper>
);

export default BreadcrumbLink;

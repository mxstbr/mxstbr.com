import { Heading } from "rebass";

const BaseHeading = props => (
  <Heading
    lineHeight={1.25}
    fontFamily="system"
    alignSelf="flex-start"
    {...props}
  />
);

const H2 = props => (
  <BaseHeading fontSize={5} as="h2" mb={4} mt={5} {...props} />
);
const H3 = props => <BaseHeading fontSize={3} as="h3" my={1} {...props} />;

export { H2, H3 };

export default BaseHeading;

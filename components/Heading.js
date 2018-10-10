import { Heading } from "rebass";

const BaseHeading = props => <Heading fontFamily="system" {...props} />;

const H2 = props => (
  <BaseHeading fontSize={5} as="h2" mb={4} mt={5} {...props} />
);
const H3 = props => (
  <BaseHeading fontSize={3} as="h3" mb={2} mt={1} {...props} />
);

export { H2, H3 };

export default BaseHeading;

import { Heading } from "rebass";
import slug from "slugg";

const BaseHeading = props => (
  <>
    {(typeof props.children === "string" ||
      typeof props.children === "number") && (
      <span
        style={{
          marginTop: "-65px",
          paddingBottom: "65px",
          display: "block",
          position: "absolute"
        }}
        id={slug(props.children)}
      />
    )}
    <Heading
      lineHeight={1.25}
      fontFamily="system"
      alignSelf="flex-start"
      {...props}
    />
  </>
);

const H2 = props => (
  <BaseHeading fontSize={5} as="h2" mb={3} mt={5} {...props} />
);
const H3 = props => <BaseHeading fontSize={3} as="h3" my={1} {...props} />;

export { H2, H3 };

export default BaseHeading;

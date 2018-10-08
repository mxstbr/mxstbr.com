import styled from "styled-components";

export default styled.div`
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  width: 100%;
  padding: 8px;
  transition: box-shadow 50ms ease-in-out;

  &:hover {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  }
`;

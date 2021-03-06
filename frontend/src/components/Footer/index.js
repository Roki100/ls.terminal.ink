import React from 'react';
import { FormattedMessage } from 'react-intl';
import PageContainer from '../PageContainer';

import './index.scss';

const Footer = () => (
  <PageContainer className="right-text">
    <p>
      <a className="footer-link" href="https://github.com/Terminal/Discord_Fork/blob/v2/LICENCE">
        <FormattedMessage id="footer.licence" />
      </a>
      <a className="footer-link" href="https://github.com/Terminal/Discord_Fork/network/dependencies">
        <FormattedMessage id="footer.attribution" />
      </a>
      <a className="footer-link" href="https://github.com/Terminal/Discord_Fork">
        <FormattedMessage id="footer.source" />
      </a>
      <a className="footer-link" href="https://discord.gg/8uC6aKZ" target="_blank" rel="noopener noreferrer">
        <FormattedMessage id="footer.terminal" />
      </a>
    </p>
    <p>
      <FormattedMessage id="copyright" />
    </p>
  </PageContainer>
);

export default Footer;

const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { JwtExpiredError, JwtInvalidClaimError } = require("aws-jwt-verify/error");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
});

const verifyAccessToken = async (req, res, next) => {
  try {
    let accessToken = req.headers.authorization.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'Missing Token' });
    }
    let payload = await verifier.verify(accessToken);
    req.user = payload;
    return next();
  } catch (error) {
    console.error('Access token verification failed:', error);
    return res.status(401).json({ error: 'Token is invalid or expired' });
  }
};

const verifyAccessTokenAndAssertParentSupportGroupRole = async (req, res, next) => {
  try {
    let accessToken = req.headers.authorization.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'Missing Token' });
    }
    let payload = await verifier.verify(accessToken, {
      groups: 'ParentSupportGroup'
    });
    req.user = payload;
    return next();
  } catch (error) {
    console.error('Access token verification failed:', error);
    if (error instanceof JwtExpiredError) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    } else if (error instanceof JwtInvalidClaimError) {
      return res.status(403).json({ error: 'User is not authorized to perform this action' });
    } else {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const verifyAccessTokenAndAssertParentSupportGroupAndAbove = async (req, res, next) => {
  try {
    let accessToken = req.headers.authorization.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'Missing Token' });
    }
    let payload = await verifier.verify(accessToken, {
      groups: [
        'ParentSupportGroup',
        'SchoolStaff',
        'TCCAdministrators'
      ]
    });
    req.user = payload;
    return next();
  } catch (error) {
    console.error('Access token verification failed:', error);
    if (error instanceof JwtExpiredError) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    } else if (error instanceof JwtInvalidClaimError) {
      return res.status(403).json({ error: 'User is not authorized to perform this action' });
    } else {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const verifyAccessTokenAndAssertSchoolStaffRole = async (req, res, next) => {
  try {
    let accessToken = req.headers.authorization.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'Missing Token' });
    }
    let payload = await verifier.verify(accessToken, {
      groups: 'SchoolStaff'
    });
    req.user = payload;
    return next();
  } catch (error) {
    console.error('Access token verification failed:', error);
    if (error instanceof JwtExpiredError) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    } else if (error instanceof JwtInvalidClaimError) {
      return res.status(403).json({ error: 'User is not authorized to perform this action' });
    } else {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const verifyAccessTokenAndAssertSchoolStaffAndAbove = async (req, res, next) => {
  try {
    let accessToken = req.headers.authorization.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'Missing Token' });
    }
    let payload = await verifier.verify(accessToken, {
      groups: [
        'SchoolStaff',
        'TCCAdministrators'
      ]
    });
    req.user = payload;
    return next();
  } catch (error) {
    console.error('Access token verification failed:', error);
    if (error instanceof JwtExpiredError) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    } else if (error instanceof JwtInvalidClaimError) {
      return res.status(403).json({ error: 'User is not authorized to perform this action' });
    } else {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const verifyAccessTokenAndAssertTCCAdministratorRole = async (req, res, next) => {
  try {
    let accessToken = req.headers.authorization.split(' ')[1];
    if (!accessToken) {
      return res.status(401).json({ error: 'Missing Token' });
    }
    let payload = await verifier.verify(accessToken, {
      groups: 'TCCAdministrators'
    });
    req.user = payload;
    return next();
  } catch (error) {
    console.error('Access token verification failed:', error);
    if (error instanceof JwtExpiredError) {
      return res.status(401).json({ error: 'Token is invalid or expired' });
    } else if (error instanceof JwtInvalidClaimError) {
      return res.status(403).json({ error: 'User is not authorized to perform this action' });
    } else {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = {
  verifyAccessToken,
  verifyAccessTokenAndAssertParentSupportGroupRole,
  verifyAccessTokenAndAssertParentSupportGroupAndAbove,
  verifyAccessTokenAndAssertSchoolStaffRole,
  verifyAccessTokenAndAssertSchoolStaffAndAbove,
  verifyAccessTokenAndAssertTCCAdministratorRole
};
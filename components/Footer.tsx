import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Who we are', href: '/' },
  { label: 'What we do', href: '/' },
  { label: 'What we offer', href: '/' },
  { label: 'Contact Us', href: '/' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#69aa56',
        color: '#ffffff',
        py: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Stack alignItems="center" spacing={2}>
          {/* Logo and Social Media */}
          <Stack direction="row" alignItems="center" spacing={2}>
            {/* TCC Brand */}
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              TCC
            </Typography>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: 'rgba(255,255,255,0.5)', height: 24, alignSelf: 'center' }}
            />

            {/* Social Media Icons */}
            <Stack direction="row" spacing={0.5}>
              <IconButton
                href="#"
                aria-label="Facebook"
                size="small"
                sx={{ color: '#ffffff', '&:hover': { opacity: 0.8 } }}
              >
                <FaFacebookF size={16} />
              </IconButton>
              <IconButton
                href="#"
                aria-label="Twitter"
                size="small"
                sx={{ color: '#ffffff', '&:hover': { opacity: 0.8 } }}
              >
                <FaTwitter size={16} />
              </IconButton>
              <IconButton
                href="#"
                aria-label="Instagram"
                size="small"
                sx={{ color: '#ffffff', '&:hover': { opacity: 0.8 } }}
              >
                <FaInstagram size={16} />
              </IconButton>
            </Stack>
          </Stack>

          {/* Navigation Links */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="center"
            alignItems="center"
            useFlexGap
          >
            {NAV_LINKS.map((link, index) => (
              <Stack key={link.label} direction="row" alignItems="center" spacing={1}>
                <Link
                  href={link.href}
                  underline="hover"
                  sx={{ color: '#ffffff', fontSize: '0.875rem' }}
                >
                  {link.label}
                </Link>
                {index < NAV_LINKS.length - 1 && (
                  <Typography
                    component="span"
                    sx={{ opacity: 0.5, fontSize: '0.875rem' }}
                  >
                    |
                  </Typography>
                )}
              </Stack>
            ))}
          </Stack>

          {/* Description */}
          <Typography
            variant="body2"
            align="center"
            sx={{ maxWidth: 600, opacity: 0.9 }}
          >
            Empowering sustainable education and resource management through
            innovative solutions. Building a circular economy in education for a
            better tomorrow.
          </Typography>

          {/* Copyright */}
          <Typography variant="body2">
            &copy; {currentYear} The Circular Classroom
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}

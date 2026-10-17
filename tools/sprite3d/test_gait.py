"""Loop position/velocity and balanced contact timing without Blender."""
import unittest
from gait import foot


class GaitTest(unittest.TestCase):
    def test_loop_and_contacts(self):
        for boundary in (0.0, .5, 1.0):
            left = foot(boundary-1e-7,.32,.16)
            right = foot(boundary+1e-7,.32,.16)
            self.assertAlmostEqual(left[0], right[0], places=6)
            h = 1e-5
            vleft = (foot(boundary-h,.32,.16)[0]-foot(boundary-2*h,.32,.16)[0])/h
            vright = (foot(boundary+2*h,.32,.16)[0]-foot(boundary+h,.32,.16)[0])/h
            self.assertAlmostEqual(vleft, vright, places=3)
        for i in range(500):
            y,z,stance = foot(i/1000,.32,.16)
            self.assertTrue(stance)
            self.assertEqual(z,0)
        self.assertGreater(foot(.75,.32,.16)[1],0)


unittest.main()

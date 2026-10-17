"""Deterministic locomotion; no image generation or direction-specific poses."""
import math


def foot(phase, stride, lift):
    u = phase % 1.0
    if u < 0.5:
        return stride * (-0.5 + 2 * u), 0.0, True
    t = 2 * u - 1
    # Hermite swing matches the stance velocity at both contact boundaries.
    # Brief toe-off/landing overshoot gives a C1 loop rather than a speed snap.
    return stride * (0.5 + 4*t**3 - 6*t*t + t), lift * math.sin(math.pi*t)**2, False


def knee(hip, ankle, length):
    # Equal two-link leg, knee bent toward character forward (-Y).
    from mathutils import Vector
    h, a = Vector(hip), Vector(ankle)
    delta = a-h
    if delta.length >= 2*length:
        raise ValueError('Unreachable foot target: adjust rig dimensions/stride')
    perpendicular = Vector((0, -1, 0))
    perpendicular -= delta.normalized() * perpendicular.dot(delta.normalized())
    return (h+a)/2 + perpendicular.normalized()*math.sqrt(length*length-delta.length_squared/4)

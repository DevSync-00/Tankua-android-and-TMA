import unittest

from scripts.destination_image_pipeline.matching import aliases, normalize, score
from scripts.destination_image_pipeline.models import Candidate, Destination


class MatchingTests(unittest.TestCase):
    def test_normalizes_punctuation_and_accents(self):
        self.assertEqual(normalize("Bété Giyorgis (Lalibela)"), "bete giyorgis lalibela")

    def test_aliases_include_location_and_spelling(self):
        values=aliases(Destination("1","Asella Referral Hospital","Oromia","Asella"))
        self.assertTrue(any("asela" in normalize(x) for x in values))
        self.assertIn("Asella Referral Hospital, Oromia",values)

    def test_exact_nearby_candidate_scores_high(self):
        d=Destination("1","Erta Ale","Afar","",13.60,40.66,"nature")
        c=Candidate("wikimedia","Erta Ale volcano","x","y","CC BY-SA",width=1600,height=1000,latitude=13.61,longitude=40.67,category_terms=["mountain landscape"])
        self.assertGreaterEqual(score(d,c,aliases(d)),0.85)

    def test_far_mismatch_rejected(self):
        d=Destination("1","Gorgora Lake Tana","Amhara","Gorgora",12.23,37.29,"nature")
        c=Candidate("wikimedia","Addis Ababa skyline","x","y","CC BY",width=1200,height=800,latitude=9.03,longitude=38.74)
        score(d,c,aliases(d))
        self.assertTrue(c.rejection_reasons)


if __name__ == "__main__": unittest.main()
